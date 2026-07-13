"""
Scraper para campeonatochileno.cl
Extrae partidos de Sub-11 a Sub-20 y genera data/matches.json
"""

import json
import re
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

CATEGORIES = {
    "sub-11": "https://www.campeonatochileno.cl/ligas/campeonato-infantil-sub-11/",
    "sub-12": "https://www.campeonatochileno.cl/ligas/campeonato-infantil-sub-12/",
    "sub-13": "https://www.campeonatochileno.cl/ligas/campeonato-infantil-sub-13/",
    "sub-14": "https://www.campeonatochileno.cl/ligas/campeonato-nacional-infantil-sub-14/",
    "sub-15": "https://www.campeonatochileno.cl/ligas/campeonato-nacional-formativo-sub-15/",
    "sub-16": "https://www.campeonatochileno.cl/ligas/campeonato-nacional-formativo-sub-16/",
    "sub-18": "https://www.campeonatochileno.cl/ligas/campeonato-nacional-formativo-sub-18/",
    "sub-20": "https://www.campeonatochileno.cl/ligas/campeonato-nacional-formativo-sub-20/",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; cadetes.cl/1.0)"
}

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}


def parse_date(date_str: str) -> str | None:
    """'14 de marzo' -> '2025-03-14'"""
    match = re.match(r"(\d+)\s+de\s+(\w+)", date_str.strip().lower())
    if not match:
        return None
    day, month_name = int(match.group(1)), match.group(2)
    month = MONTHS.get(month_name)
    if not month:
        return None
    year = datetime.now().year
    return f"{year}-{month:02d}-{day:02d}"


def clean_team_name(name: str) -> str:
    """'Coquimbo Unido Sub-17' -> 'Coquimbo Unido'"""
    return re.sub(r"\s*sub-?\d+$", "", name.strip(), flags=re.IGNORECASE).strip()


def scrape_category(category: str, url: str) -> list[dict]:
    print(f"  Scraping {category}...")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        print(f"  ERROR {category}: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    matches = []
    current_round = None
    current_date = None

    # La página agrupa partidos por fecha/jornada
    # Buscamos el contenedor principal de partidos
    content = soup.find("main") or soup.find("div", class_=re.compile(r"content|main|liga", re.I))
    if not content:
        content = soup

    elements = content.find_all(["h2", "h3", "h4", "div", "article", "section"])

    for el in content.find_all(True, recursive=False):
        _parse_element(el, category, matches, {"round": None, "date": None})

    # Fallback: parsear texto completo estructurado
    if not matches:
        matches = _parse_text_content(soup, category)

    return matches


def _parse_text_content(soup: BeautifulSoup, category: str) -> list[dict]:
    """Parse basado en el texto visible, que sabemos que es consistente."""
    matches = []
    main = soup.find("main") or soup.body
    text = main.get_text(separator="\n")
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    current_round = None
    current_date = None
    i = 0

    while i < len(lines):
        line = lines[i]

        # Detectar jornada: "Fecha 1", "Fecha 2", etc.
        round_match = re.match(r"^fecha\s+(\d+)$", line.lower())
        if round_match:
            current_round = int(round_match.group(1))
            i += 1
            continue

        # Detectar fecha: "14 de marzo"
        date_match = re.match(r"^\d+\s+de\s+\w+$", line.lower())
        if date_match:
            current_date = parse_date(line)
            i += 1
            continue

        # Detectar hora: "9:00 am", "3:30 pm"
        time_match = re.match(r"^(\d+:\d+\s*(?:am|pm))$", line.lower())
        if time_match and i + 4 < len(lines):
            match_time = lines[i]
            home_team = clean_team_name(lines[i + 1]) if i + 1 < len(lines) else ""
            home_score_str = lines[i + 2] if i + 2 < len(lines) else ""
            away_score_str = lines[i + 3] if i + 3 < len(lines) else ""
            away_team = clean_team_name(lines[i + 4]) if i + 4 < len(lines) else ""
            stadium = lines[i + 5] if i + 5 < len(lines) else ""

            # Validar que scores sean números
            if re.match(r"^\d+$", home_score_str) and re.match(r"^\d+$", away_score_str):
                status = "played"
                home_score = int(home_score_str)
                away_score = int(away_score_str)
            else:
                status = "pending"
                home_score = None
                away_score = None
                # Reusar líneas que no son scores
                away_team = clean_team_name(home_score_str) if home_team else ""
                stadium = away_score_str
                i += 4
                continue

            # El estadio puede ser la siguiente línea no-hora
            if i + 5 < len(lines) and not re.match(r"^\d+:\d+", lines[i + 5]) and not re.match(r"^fecha\s+\d+$", lines[i + 5].lower()):
                stadium = lines[i + 5]
                skip = 6
            else:
                skip = 5

            matches.append({
                "category": category,
                "round": current_round,
                "date": current_date,
                "time": match_time,
                "home_team": home_team,
                "away_team": away_team,
                "home_score": home_score,
                "away_score": away_score,
                "stadium": stadium,
                "status": status,
            })
            i += skip
            continue

        i += 1

    return matches


def _parse_element(el, category, matches, state):
    pass  # placeholder — usamos _parse_text_content como estrategia principal


def main():
    output_dir = Path(__file__).parent.parent / "data"
    output_dir.mkdir(exist_ok=True)

    all_matches = []
    for category, url in CATEGORIES.items():
        matches = scrape_category(category, url)
        all_matches.extend(matches)
        print(f"  -> {len(matches)} partidos")
        time.sleep(1)  # respetuoso con el servidor

    output = {
        "updated_at": datetime.utcnow().isoformat() + "Z",
        "total": len(all_matches),
        "matches": all_matches,
    }

    out_file = output_dir / "matches.json"
    out_file.write_text(json.dumps(output, ensure_ascii=False, indent=2))
    print(f"\nTotal: {len(all_matches)} partidos guardados en {out_file}")


if __name__ == "__main__":
    main()
