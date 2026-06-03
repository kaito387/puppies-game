import {
  ANIMALS,
  EMBASSY_COST_GROWTH_MULTIPLIER,
  EMBASSY_QUANTITY_BONUS_PER_LEVEL,
  EXPLORE_DOGPOWER_COST,
  EXPLORE_DOGPOWER_REFUND,
  type Animal,
  type GameState,
  type Season,
} from '@/engine/types'
import { min } from '@/engine/utils'
import { isRequirementSatisfied } from '@/engine/technologies'
import { calculateCalendarProgress } from '@/engine/calendar'
import { calculateResourceLimits } from '@/engine/gameLoop'

// ---- Helpers ----

export function getAnimalById(animalId: string): Animal {
  const animal = ANIMALS.find((a) => a.id === animalId)
  if (!animal) {
    throw new Error(`动物 ${animalId} 不存在`)
  }
  return animal
}

export function isAnimalDiscovered(state: GameState, animalId: string): boolean {
  return state.discoveredAnimals.includes(animalId)
}

export function getEmbassyLevel(state: GameState, animalId: string): number {
  return state.embassyLevels[animalId] || 0
}

export function getAnimalSeasonMultiplier(animal: Animal, season: Season): number {
  return animal.seasonBonus[season] ?? 1.0
}

/** 获取动物的有效出售资源（基础 + 大使馆解锁的额外资源） */
export function getAnimalEffectiveSellResources(
  state: GameState,
  animalId: string,
): Record<string, number> {
  const animal = getAnimalById(animalId)
  const embassyLevel = getEmbassyLevel(state, animalId)

  const sellResources: Record<string, number> = { ...animal.sellResources }

  if (animal.embassyUnlocks) {
    for (const unlock of animal.embassyUnlocks) {
      if (embassyLevel >= unlock.level) {
        for (const [resourceId, amount] of Object.entries(unlock.sellResources)) {
          sellResources[resourceId] = (sellResources[resourceId] || 0) + amount
        }
      }
    }
  }

  return sellResources
}

/**
 * 计算玩家从动物获得的资源数量（应用季节系数和大使馆数量加成）
 * 公式: 最终数量 = floor(基础数量 × 季节系数 × (1 + 大使馆等级 × 每级加成))
 */
export function calculateSellAmounts(
  state: GameState,
  animalId: string,
): Record<string, number> {
  const animal = getAnimalById(animalId)
  const calendar = calculateCalendarProgress(state)
  const seasonMultiplier = getAnimalSeasonMultiplier(animal, calendar.season)
  const embassyLevel = getEmbassyLevel(state, animalId)
  const embassyMultiplier = 1 + embassyLevel * EMBASSY_QUANTITY_BONUS_PER_LEVEL

  const effectiveSell = getAnimalEffectiveSellResources(state, animalId)
  const sellAmounts: Record<string, number> = {}

  for (const [resourceId, baseAmount] of Object.entries(effectiveSell)) {
    sellAmounts[resourceId] = Math.floor(baseAmount * seasonMultiplier * embassyMultiplier)
  }

  return sellAmounts
}

/**
 * 计算玩家支付给动物的资源成本（不受季节和大使馆影响）
 */
export function calculateBuyCosts(
  _state: GameState,
  animalId: string,
): Record<string, number> {
  const animal = getAnimalById(animalId)
  return { ...animal.buyCosts }
}

// ---- Embassy ----

/** 计算大使馆升级费用（基础费用 × 成长系数 ^ 当前等级） */
export function getEmbassyUpgradeCost(
  state: GameState,
  animalId: string,
): Record<string, number> {
  const animal = getAnimalById(animalId)
  const currentLevel = getEmbassyLevel(state, animalId)
  const cost: Record<string, number> = {}

  for (const [resourceId, baseCost] of Object.entries(animal.embassyCost)) {
    cost[resourceId] = Math.ceil(baseCost * EMBASSY_COST_GROWTH_MULTIPLIER ** currentLevel)
  }

  return cost
}

export function canUpgradeEmbassy(state: GameState, animalId: string): boolean {
  if (!isAnimalDiscovered(state, animalId)) return false

  const cost = getEmbassyUpgradeCost(state, animalId)
  for (const [resourceId, amount] of Object.entries(cost)) {
    if ((state.resourceCounts[resourceId] || 0) < amount) return false
  }

  return true
}

export function upgradeEmbassy(state: GameState, animalId: string): GameState {
  if (!isAnimalDiscovered(state, animalId)) {
    throw new Error(`尚未发现动物 ${animalId}`)
  }

  const cost = getEmbassyUpgradeCost(state, animalId)
  const nextResourceCounts: Record<string, number> = { ...state.resourceCounts }

  for (const [resourceId, amount] of Object.entries(cost)) {
    if ((nextResourceCounts[resourceId] || 0) < amount) {
      throw new Error(`资源 ${resourceId} 不足，无法升级大使馆`)
    }
    nextResourceCounts[resourceId] = (nextResourceCounts[resourceId] || 0) - amount
  }

  const nextEmbassyLevels: Record<string, number> = { ...state.embassyLevels }
  nextEmbassyLevels[animalId] = (nextEmbassyLevels[animalId] || 0) + 1

  return {
    ...state,
    resourceCounts: nextResourceCounts,
    embassyLevels: nextEmbassyLevels,
  }
}

// ---- Exploration ----

/** 已经发现的动物（不受季节限制，均可交易） */
export function getAvailableAnimals(state: GameState): Animal[] {
  return ANIMALS.filter((animal) => isAnimalDiscovered(state, animal.id))
}

/** 尚未发现且前置条件满足的动物（用于探索候选） */
export function getUndiscoveredEligibleAnimals(state: GameState): Animal[] {
  return ANIMALS.filter((animal) => {
    if (isAnimalDiscovered(state, animal.id)) return false
    return isRequirementSatisfied(state, animal.prerequisites)
  })
}

export interface ExploreResult {
  nextState: GameState
  discoveredAnimal?: Animal
  allDiscovered?: boolean
  blockedReason?: 'insufficientDogpower' | 'allDiscovered'
}

/**
 * 执行一次探索：尝试发现一个新动物。
 * - 消耗 1000 汪力
 * - 如果存在未发现且前置条件满足的动物 → 发现一个（优先按定义顺序）并持久保留
 * - 如果所有满足前置条件的动物都已发现 → 扣除 1000 后返还 900（净消耗 100）
 * - 汪力不足 → 不执行任何操作
 */
export function exploreTradeAnimal(state: GameState): ExploreResult {
  if ((state.resourceCounts.dogpower || 0) < EXPLORE_DOGPOWER_COST) {
    return { nextState: state, blockedReason: 'insufficientDogpower' }
  }

  const eligible = getUndiscoveredEligibleAnimals(state)
  const nextResourceCounts: Record<string, number> = {
    ...state.resourceCounts,
    dogpower: (state.resourceCounts.dogpower || 0) - EXPLORE_DOGPOWER_COST,
  }

  if (eligible.length === 0) {
    nextResourceCounts.dogpower = (nextResourceCounts.dogpower || 0) + EXPLORE_DOGPOWER_REFUND

    return {
      nextState: { ...state, resourceCounts: nextResourceCounts },
      allDiscovered: true,
    }
  }

  const discoveredAnimal = eligible[0]

  return {
    nextState: {
      ...state,
      resourceCounts: nextResourceCounts,
      discoveredAnimals: [...state.discoveredAnimals, discoveredAnimal.id],
    },
    discoveredAnimal,
  }
}

// ---- Trade / Exchange ----

export interface TradeResult {
  nextState: GameState
  gained: Record<string, number>
  paid: Record<string, number>
  blockedReason?: 'notDiscovered' | 'insufficientResources'
}

/**
 * 与已发现的动物进行一次交易：
 * - 已发现动物均可交易（不受季节限制，季节仅影响交易效率）
 * - 扣除购买资源（buyCosts），发放出售资源（sellAmounts 含季节+大使馆加成）
 * - 发放资源时遵守当前资源上限
 */
export function tradeWithAnimal(state: GameState, animalId: string): TradeResult {
  if (!isAnimalDiscovered(state, animalId)) {
    return { nextState: state, gained: {}, paid: {}, blockedReason: 'notDiscovered' }
  }

  const buyCosts = calculateBuyCosts(state, animalId)
  const sellAmounts = calculateSellAmounts(state, animalId)

  for (const [resourceId, cost] of Object.entries(buyCosts)) {
    if ((state.resourceCounts[resourceId] || 0) < cost) {
      return { nextState: state, gained: {}, paid: {}, blockedReason: 'insufficientResources' }
    }
  }

  const nextResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, cost] of Object.entries(buyCosts)) {
    nextResourceCounts[resourceId] = (nextResourceCounts[resourceId] || 0) - cost
  }

  const limits = calculateResourceLimits(state)
  const gained: Record<string, number> = {}

  for (const [resourceId, amount] of Object.entries(sellAmounts)) {
    if (amount <= 0) continue
    const current = nextResourceCounts[resourceId] || 0
    const limit = limits[resourceId] || 0
    const actual = min(amount, Math.max(0, limit - current))
    nextResourceCounts[resourceId] = current + actual
    gained[resourceId] = actual
  }

  return {
    nextState: { ...state, resourceCounts: nextResourceCounts },
    gained,
    paid: { ...buyCosts },
  }
}
