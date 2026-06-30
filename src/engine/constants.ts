export const GAME_TICK_INTERVAL_MS = 200 // 游戏 200ms 更新一次
export const AUTO_SAVE_INTERVAL_TICKS = 10 // 每 10 个 tick 自动保存一次

export const INITIAL_RESOURCE_LIMITS = {
  food: 250,
  wood: 160,
  stone: 160,
  iron: 100,
  coal: 100,
  gold: 80,
  science: 120,
  culture: 160,
  dogpower: 100,
  fur: 140,
}

export const INITIAL_POPULATION_CAP = 2
export const INITIAL_DOG_COUNT = 1
export const INITIAL_FOOD = 30
export const POPULATION_GROWTH_RATE = 0.01
export const FOOD_CONSUMPTION_PER_PUPPY_PER_TICK = 0.12

export const DOG_EXPERIENCE_OUTPUT_BONUS_COEFFICIENT = 0.02
export const DOG_EXPERIENCE_OUTPUT_BONUS_CONSTANT = 1
// coeff * log(exp) + constant, capped at 3x bonus
export const DOG_EXPERIENCE_OUTPUT_BONUS_CAP = 3
export const DOG_EXPERIENCE_GAIN_PER_TICK = 1

export const CALENDAR_START_YEAR = 387
export const CALENDAR_START_MONTH = 3
export const CALENDAR_START_DAY = 1
export const TICKS_PER_DAY = 15
export const DAYS_PER_MONTH = 30
export const MONTHS_PER_YEAR = 12
export const DOGPOWER_PER_EXPLORATION = 100

export const PROBABILITY_GET_FUR_FROM_EXPLORATION = 0.7
export const FUR_REWARD_MIN = 15
export const FUR_REWARD_MAX = 35
