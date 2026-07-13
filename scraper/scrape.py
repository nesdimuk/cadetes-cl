"""
Scraper para campeonatochileno.cl
Extrae partidos de Sub-11 a Sub-20 y genera data/matches.json
"""

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

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

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; cadetes.cl/1.0)"}

MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
    "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
    "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
}


def clean_team_name(name: str) -> str:
    return re.sub(r"\s*sub-?\d+$", "", name.strip(), flags=re.IGNORECASE).strip()


def parse_date(date_str: str) -> str | None:
    match = re.match(r"(\d+)\s+de\s+(\w+)", date_str.strip().lower())
    if not match:
        return None
    day, month_name = int(match.group(1)), match.group(2)
    month = MONTHS.get(month_name)
    if not month:
        return None
    year = datetime.now().year
    return f"{year}-{month:02d}-{day:02d}"


# ── Parser moderno (anwp-fl-game elements) ────────────────────────────────────

def parse_anwp_games(soup: BeautifulSoup, category: str) -> list[dict]:
    """Parsea los elementos anwp-fl-game que contienen TODOS los partidos."""
    matches = []

    # Los slides del swiper corresponden a cada jornada
    slides = soup.find_all("div", class_="anwp-fl-matchweek-slides__swiper-slide")

    for slide_idx, slide in enumerate(slides):
        # La jornada puede estar en el texto del slide o inferirse del índice
        round_num = slide_idx + 1

        game_divs = slide.find_all("div", attrs={"data-anwp-match": True})
        for g in game_divs:
            dt_str = g.get("data-fl-game-datetime") or g.get("data-fl-game-kickoff") or ""

            # Filtrar fechas inválidas (año negativo = sin fecha)
            if not dt_str.startswith("2"):
                date_val = None
                time_val = None
            else:
                try:
                    dt = datetime.fromisoformat(dt_str)
                    date_val = dt.strftime("%Y-%m-%d")
                    time_val = dt.strftime("%-I:%M %p").lower()
                except Exception:
                    date_val = None
                    time_val = None

            home_el = g.find(class_=re.compile(r"team-home-title"))
            away_el = g.find(class_=re.compile(r"team-away.*title|team-away-title"))
            score_home_el = g.find(class_=re.compile(r"scores-home"))
            score_away_el = g.find(class_=re.compile(r"scores-away"))
            stadium_el = g.find(class_=re.compile(r"stadium|venue|ground", re.I))

            if not home_el or not away_el:
                continue

            home_team = clean_team_name(home_el.get_text(strip=True))
            away_team = clean_team_name(away_el.get_text(strip=True))

            home_score_txt = score_home_el.get_text(strip=True) if score_home_el else "–"
            away_score_txt = score_away_el.get_text(strip=True) if score_away_el else "–"

            if re.match(r"^\d+$", home_score_txt) and re.match(r"^\d+$", away_score_txt):
                status = "played"
                home_score = int(home_score_txt)
                away_score = int(away_score_txt)
            else:
                status = "pending"
                home_score = None
                away_score = None

            stadium = stadium_el.get_text(strip=True) if stadium_el else ""

            matches.append({
                "category": category,
                "round": round_num,
                "date": date_val,
                "time": time_val,
                "home_team": home_team,
                "away_team": away_team,
                "home_score": home_score,
                "away_score": away_score,
                "stadium": stadium,
                "status": status,
            })

    return matches


# ── Parser de texto (fallback para páginas simples) ───────────────────────────

def _extract_first_section(lines: list[str]) -> list[str]:
    first_fecha1 = None
    for i, line in enumerate(lines):
        if re.match(r"^fecha\s+1$", line.lower()):
            if first_fecha1 is None:
                first_fecha1 = i
            else:
                return lines[first_fecha1:i]
    return lines[first_fecha1:] if first_fecha1 is not None else lines


def _parse_text_content(soup: BeautifulSoup, category: str) -> list[dict]:
    matches = []
    main = soup.find("main") or soup.body
    text = main.get_text(separator="\n")
    all_lines = [l.strip() for l in text.split("\n") if l.strip()]
    lines = _extract_first_section(all_lines)

    current_round = None
    current_date = None
    i = 0

    while i < len(lines):
        line = lines[i]

        round_match = re.match(r"^fecha\s+(\d+)$", line.lower())
        if round_match:
            current_round = int(round_match.group(1))
            i += 1
            continue

        date_match = re.match(r"^\d+\s+de\s+\w+$", line.lower())
        if date_match:
            current_date = parse_date(line)
            i += 1
            continue

        if line in ("–", "-", "—"):
            i += 1
            continue

        time_match = re.match(r"^(\d+:\d+\s*(?:am|pm))$", line.lower())
        if time_match and i + 4 < len(lines):
            match_time = lines[i]
            home_team = clean_team_name(lines[i + 1])
            home_score_str = lines[i + 2]
            away_score_str = lines[i + 3]
            away_team = clean_team_name(lines[i + 4])

            is_played = re.match(r"^\d+$", home_score_str) and re.match(r"^\d+$", away_score_str)
            is_pending = home_score_str in ("–", "-", "—") and away_score_str in ("–", "-", "—")

            if is_played:
                status = "played"
                home_score = int(home_score_str)
                away_score = int(away_score_str)
            elif is_pending:
                status = "pending"
                home_score = None
                away_score = None
            else:
                i += 1
                continue

            if i + 5 < len(lines) and not re.match(r"^\d+:\d+", lines[i + 5]) and not re.match(r"^fecha\s+\d+$", lines[i + 5].lower()):
                stadium = lines[i + 5]
                skip = 6
            else:
                stadium = ""
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


# ── Fetch y dispatch ──────────────────────────────────────────────────────────

def fetch_soup(url: str) -> BeautifulSoup | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        print(f"  requests error: {e}")
        return None


def fetch_soup_playwright(url: str) -> BeautifulSoup | None:
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)
            html = page.content()
            browser.close()
            return BeautifulSoup(html, "html.parser")
    except Exception as e:
        print(f"  Playwright error: {e}")
        return None


def scrape_category(category: str, url: str) -> list[dict]:
    print(f"  Scraping {category}...")

    # Intentar primero con requests (rápido)
    soup = fetch_soup(url)
    if not soup:
        return []

    # Si la página tiene elementos anwp-fl-game, usamos el parser moderno
    game_divs = soup.find_all("div", attrs={"data-anwp-match": True})
    if game_divs:
        matches = parse_anwp_games(soup, category)
        # Si los partidos parecen incompletos (slides no cargados), usar Playwright
        slides = soup.find_all("div", class_="anwp-fl-matchweek-slides__swiper-slide")
        valid = [m for m in matches if m["date"] is not None]
        if not valid or len(slides) < 3:
            print(f"  -> usando Playwright para {category}...")
            soup2 = fetch_soup_playwright(url)
            if soup2:
                matches = parse_anwp_games(soup2, category)
        return matches

    # Fallback: parser de texto para páginas simples
    return _parse_text_content(soup, category)


def main():
    output_dir = Path(__file__).parent.parent / "data"
    output_dir.mkdir(exist_ok=True)

    all_matches = []
    for category, url in CATEGORIES.items():
        matches = scrape_category(category, url)
        all_matches.extend(matches)
        print(f"  -> {len(matches)} partidos")
        time.sleep(1)

    output = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "total": len(all_matches),
        "matches": all_matches,
    }

    out_file = output_dir / "matches.json"
    out_file.write_text(json.dumps(output, ensure_ascii=False, indent=2))
    print(f"\nTotal: {len(all_matches)} partidos guardados en {out_file}")


if __name__ == "__main__":
    main()
