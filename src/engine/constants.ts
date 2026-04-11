export const GAME_TICK_INTERVAL_MS = 200 // 游戏 200ms 更新一次
export const AUTO_SAVE_INTERVAL_TICKS = 10 // 每 10 个 tick 自动保存一次

export const INITIAL_RESOURCE_LIMITS = {
	food: 10000,
	wood: 1500,
	stone: 1500,
}

export const INITIAL_POPULATION_CAP = 1
export const POPULATION_GROWTH_RATE = 0.02
export const FOOD_CONSUMPTION_PER_PUPPY_PER_TICK = 1.2

export const DOG_EXPERIENCE_OUTPUT_BONUS_COEFFICIENT = 1
export const DOG_EXPERIENCE_OUTPUT_BONUS_CONSTANT = 0.5
// coeff * log(exp) + constant, capped at 3x bonus
export const DOG_EXPERIENCE_OUTPUT_BONUS_CAP = 3
export const DOG_EXPERIENCE_GAIN_PER_TICK = 1
export const DOG_EXPERIENCE_GAIN_FOR_TALENT_MULTIPLIER = 1.5
