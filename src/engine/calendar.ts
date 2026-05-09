import { type GameState, type Calendar, type Season, MONTH_TO_SEASON, } from '@/engine/types'
import {
  CALENDAR_START_YEAR, 
  CALENDAR_START_MONTH,
  CALENDAR_START_DAY,
  TICKS_PER_DAY, 
  DAYS_PER_MONTH, 
  MONTHS_PER_YEAR,
} from '@/engine/constants'

export function calculateCalendarProgress(gameState: GameState): Calendar {
  const totalDays = Math.floor(gameState.tickCount / TICKS_PER_DAY)
  const day = (totalDays + CALENDAR_START_DAY - 1) % DAYS_PER_MONTH + 1
  const monthOffset = Math.floor((totalDays + CALENDAR_START_DAY - 1) / DAYS_PER_MONTH)
  const month = (CALENDAR_START_MONTH + monthOffset - 1) % MONTHS_PER_YEAR + 1
  const year = CALENDAR_START_YEAR + Math.floor((CALENDAR_START_MONTH + monthOffset - 1) / MONTHS_PER_YEAR)
  const season: Season = MONTH_TO_SEASON[month]
  return {
    year: year,
    month: month,
    day: day,
    season: season,
  }
}