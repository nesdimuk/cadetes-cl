"""
Email semanal personalizado para padres de cadetes.
Corre cada viernes via GitHub Actions.
"""
import json
import os
import re
from datetime import datetime
from pathlib import Path

import requests

BREVO_API_KEY = os.environ["BREVO_API_KEY"]
BREVO_LIST_ID = 6
HEADERS = {"api-key": BREVO_API_KEY, "Content-Type": "application/json"}
TODAY = datetime.today().strftime("%Y-%m-%d")

CATEGORY_LABELS = {
    "sub-11": "Sub 11", "sub-12": "Sub 12", "sub-13": "Sub 13",
    "sub-14": "Sub 14", "sub-15": "Sub 15", "sub-16": "Sub 16",
    "sub-18": "Sub 18", "sub-20": "Sub 20",
}

MONTHS_ES = [
    "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

def format_date(date_str):
    if not date_str:
        return "Por confirmar"
    y, m, d = date_str.split("-")
    days_es = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    dt = datetime(int(y), int(m), int(d))
    return f"{days_es[dt.weekday()]} {int(d)} de {MONTHS_ES[int(m)]}"

def get_contacts():
    contacts = []
    offset = 0
    limit = 50
    while True:
        r = requests.get(
            f"https://api.brevo.com/v3/contacts/lists/{BREVO_LIST_ID}/contacts",
            headers=HEADERS,
            params={"limit": limit, "offset": offset}
        )
        data = r.json()
        batch = data.get("contacts", [])
        contacts.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return contacts

def normalize(name):
    return re.sub(r"\s+", " ", name.strip().lower())

def find_group(matches, category, team_norm):
    """Encuentra el grupo del equipo usando componentes conectados del grafo de partidos."""
    played = [m for m in matches if m["category"] == category and m["status"] == "played" and m["home_score"] is not None]
    # Union-Find
    parent = {}
    def find(x):
        parent.setdefault(x, x)
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]
    def union(x, y):
        parent[find(x)] = find(y)
    for m in played:
        union(normalize(m["home_team"]), normalize(m["away_team"]))
    # Grupo del equipo buscado
    if team_norm not in parent:
        return None
    root = find(team_norm)
    return {t for t in parent if find(t) == root}

def get_standings(matches, category, team_norm=None):
    # Filtrar solo equipos del mismo grupo si se especifica equipo
    group_teams = find_group(matches, category, team_norm) if team_norm else None

    rows = {}
    for m in matches:
        if m["category"] != category or m["status"] != "played":
            continue
        if m["home_score"] is None:
            continue
        hn, an = normalize(m["home_team"]), normalize(m["away_team"])
        if group_teams and hn not in group_teams and an not in group_teams:
            continue
        for team in [m["home_team"], m["away_team"]]:
            if team not in rows:
                rows[team] = {"p": 0, "w": 0, "d": 0, "l": 0, "pts": 0, "gf": 0, "ga": 0}
        h, a = rows[m["home_team"]], rows[m["away_team"]]
        hs, as_ = m["home_score"], m["away_score"]
        h["p"] += 1; a["p"] += 1
        h["gf"] += hs; h["ga"] += as_
        a["gf"] += as_; a["ga"] += hs
        if hs > as_:
            h["w"] += 1; h["pts"] += 3; a["l"] += 1
        elif hs < as_:
            a["w"] += 1; a["pts"] += 3; h["l"] += 1
        else:
            h["d"] += 1; h["pts"] += 1; a["d"] += 1; a["pts"] += 1
    sorted_rows = sorted(rows.items(), key=lambda x: (-x[1]["pts"], -(x[1]["gf"] - x[1]["ga"]), -x[1]["gf"]))
    return sorted_rows

def build_email(contact, all_matches):
    attrs = contact.get("attributes", {})
    first_name = attrs.get("FIRSTNAME", "Papá/Mamá")
    child_name = attrs.get("CHILD_NAME", "tu hijo/a")
    team = attrs.get("TEAM", "")
    category_str = attrs.get("CATEGORY", "")

    if not team or not category_str:
        return None

    categories = [c.strip() for c in category_str.split(",") if c.strip()]
    team_norm = normalize(team)

    sections = []
    for cat in categories:
        cat_matches = [m for m in all_matches if m["category"] == cat]
        team_matches = [m for m in cat_matches
                        if normalize(m["home_team"]) == team_norm or normalize(m["away_team"]) == team_norm]

        if not team_matches:
            continue

        # Último resultado
        played = [m for m in team_matches if m["status"] == "played"]
        last = sorted(played, key=lambda m: m.get("date") or "", reverse=True)[0] if played else None

        # Próximo partido
        upcoming = [m for m in team_matches if m["status"] == "pending" and m.get("date") and m["date"] >= TODAY]
        next_match = sorted(upcoming, key=lambda m: m["date"])[0] if upcoming else None

        # Posición en tabla (solo dentro del grupo del equipo)
        standings = get_standings(cat_matches, cat, team_norm)
        pos = next((i + 1 for i, (t, _) in enumerate(standings) if normalize(t) == team_norm), None)
        total = len(standings)

        cat_label = CATEGORY_LABELS.get(cat, cat.upper())

        section = f"<h3 style='color:#166534;margin:20px 0 8px'>⚽ {cat_label}</h3>"

        if pos:
            section += f"<p>📊 <strong>{team}</strong> está <strong>{pos}° de {total} equipos</strong></p>"

        if last:
            score = f"{last['home_score']} – {last['away_score']}"
            result_team = "local" if normalize(last["home_team"]) == team_norm else "visita"
            won = (normalize(last["home_team"]) == team_norm and last["home_score"] > last["away_score"]) or \
                  (normalize(last["away_team"]) == team_norm and last["away_score"] > last["home_score"])
            drew = last["home_score"] == last["away_score"]
            emoji = "✅" if won else ("🤝" if drew else "❌")
            section += f"""
<p>{emoji} <strong>Último resultado</strong> · Fecha {last['round']}</p>
<p style='background:#f0fdf4;border-left:3px solid #16a34a;padding:8px 12px;border-radius:4px;margin:4px 0'>
  {last['home_team']} <strong>{score}</strong> {last['away_team']}<br>
  <small style='color:#6b7280'>{format_date(last.get('date'))} · de {result_team}</small>
</p>"""

        if next_match:
            section += f"""
<p>📅 <strong>Próximo partido</strong></p>
<p style='background:#eff6ff;border-left:3px solid #3b82f6;padding:8px 12px;border-radius:4px;margin:4px 0'>
  {next_match['home_team']} vs {next_match['away_team']}<br>
  <small style='color:#6b7280'>{format_date(next_match.get('date'))} · {next_match.get('time') or ''}</small>
  {f"<br><small style='color:#6b7280'>{next_match['stadium']}</small>" if next_match.get('stadium') else ''}
</p>"""
        else:
            section += "<p style='color:#9ca3af;font-size:13px'>Sin próximos partidos programados.</p>"

        sections.append(section)

    if not sections:
        return None

    body = f"""
<div style='font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1f2937'>
  <div style='background:#15803d;padding:24px;border-radius:12px 12px 0 0;text-align:center'>
    <h1 style='color:white;margin:0;font-size:24px'>⚽ Cadetes.cl</h1>
    <p style='color:#bbf7d0;margin:4px 0 0;font-size:14px'>Resumen semanal de {child_name}</p>
  </div>
  <div style='background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none'>
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>Aquí tienes el resumen de esta semana de <strong>{child_name}</strong> en <strong>{team}</strong>:</p>
    {''.join(sections)}
    <hr style='border:none;border-top:1px solid #e5e7eb;margin:24px 0'>
    <p style='text-align:center'>
      <a href='https://cadetes.cl/partidos' style='background:#16a34a;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold'>
        Ver todos los partidos →
      </a>
    </p>
    <p style='color:#9ca3af;font-size:11px;text-align:center;margin-top:16px'>
      ¿Cambió la categoría? <a href='https://cadetes.cl/actualizar?email={contact["email"]}' style='color:#16a34a'>Actualízala aquí</a><br>
      Cadetes.cl · El portal del fútbol formativo chileno
    </p>
    <p style='color:#d1d5db;font-size:10px;text-align:center;margin-top:8px'>
      Datos obtenidos de <a href='https://www.campeonatochileno.cl' style='color:#d1d5db'>campeonatochileno.cl</a> · La información se actualiza automáticamente desde esa fuente y puede no reflejar cambios de último momento.
    </p>
  </div>
</div>"""

    return {
        "to": [{"email": contact["email"], "name": first_name}],
        "subject": f"⚽ Resumen de {child_name} en {team} — esta semana",
        "htmlContent": body,
        "sender": {"name": "Cadetes.cl", "email": "marcelo@saidcoach.com"},
    }

def send_email(payload):
    r = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers=HEADERS,
        json=payload
    )
    return r.status_code, r.json() if r.content else {}

def main():
    data_file = Path(__file__).parent.parent / "frontend" / "public" / "data" / "matches.json"
    all_matches = json.loads(data_file.read_text())["matches"]

    contacts = get_contacts()
    print(f"Contactos en lista: {len(contacts)}")

    sent = 0
    skipped = 0
    for contact in contacts:
        payload = build_email(contact, all_matches)
        if not payload:
            skipped += 1
            continue
        status, resp = send_email(payload)
        if status in (200, 201):
            sent += 1
            print(f"  ✓ {contact['email']}")
        else:
            print(f"  ✗ {contact['email']} — {resp}")

    print(f"\nEnviados: {sent} | Omitidos: {skipped}")

if __name__ == "__main__":
    main()
