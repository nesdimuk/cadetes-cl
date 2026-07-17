export interface Match {
  category: string
  round: number | null
  date: string | null
  time: string
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  stadium: string
  status: "played" | "pending"
}

export interface MatchData {
  updated_at: string
  total: number
  matches: Match[]
}

export interface StandingRow {
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export interface StandingEntry {
  category: string
  group: string
  rank: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  pts: number
}

export interface StandingsData {
  updated_at: string
  total: number
  standings: StandingEntry[]
}
