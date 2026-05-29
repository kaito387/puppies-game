import { type GameState, type Trade, TRADES, SEASON_EFFECTS } from '@/engine/types'
import { isRequirementSatisfied } from '@/engine/technologies'
import { calculateCalendarProgress } from '@/engine/calendar'
import { EXPLORE_COST, EXPLORE_REFUND } from '@/engine/constants'

export function getTradeById(tradeId: string): Trade {
  const trade = TRADES.find((item) => item.id === tradeId)
  if (!trade) {
    throw new Error(`贸易 ${tradeId} 不存在`)
  }
  return trade
}

export function getEmbassyBuildingId(tradeId: string): string {
  return `embassy_${tradeId}`
}

export function getEmbassyLevel(state: GameState, tradeId: string): number {
  return state.buildings[getEmbassyBuildingId(tradeId)] || 0
}


export function canExecuteTrade(state: GameState, tradeId: string): boolean {
  const trade = getTradeById(tradeId)
  for (const [resourceId, amount] of Object.entries(trade.sells)) {
    if ((state.resourceCounts[resourceId] || 0) < amount) {
      return false
    }
  }

  return true
}

export function executeTrade(state: GameState, tradeId: string): GameState {
  const trade = getTradeById(tradeId)

  if (trade.prerequisites && !isRequirementSatisfied(state, trade.prerequisites)) {
    throw new Error(`贸易 ${tradeId} 前置条件未满足`)
  }
  if (!canExecuteTrade(state, tradeId)) {
    throw new Error(`资源不足，无法执行贸易 ${tradeId}`)
  }
  
  const nextResourceCounts = { ...state.resourceCounts }

  for (const [resourceId, amount] of Object.entries(trade.buys)) {
    nextResourceCounts[resourceId] = (nextResourceCounts[resourceId] || 0) - amount
  }

  const embassyLevel = getEmbassyLevel(state, tradeId)
  const season = calculateCalendarProgress(state).season
  let seasonMultiplier = 1
  for (const effect of SEASON_EFFECTS[season] || []) {
    if (effect.type === 'trade_bonus' && effect.targetId === tradeId) {
      seasonMultiplier *= effect.value
    }
  }
  const quantityBonus = (1 + (trade.linearQuantityBonus || 0) * embassyLevel) * seasonMultiplier
  for (const [resourceId, amount] of Object.entries(trade.sells)) {
    nextResourceCounts[resourceId] = (nextResourceCounts[resourceId] || 0) + amount * quantityBonus
  }

  for (const [level, unlocks] of Object.entries(trade.levelUnlocks || {})) {
    const levelNum = Number(level)
    if (embassyLevel >= levelNum) {
      for (const [resourceId, amount] of Object.entries(unlocks)) {
        nextResourceCounts[resourceId] = (nextResourceCounts[resourceId] || 0) + amount * quantityBonus
      }
    }
  }
  return {
    ...state,
    resourceCounts: nextResourceCounts,
  }
}

export function isAnimalDiscovered(state: GameState, animalId: string): boolean {
  return state.discoveredAnimalIds.includes(animalId)
}

function getNextUndiscoveredAnimal(state: GameState): string | null {
  return TRADES.find((animal) =>
    !state.discoveredAnimalIds.includes(animal.id) &&
    (!animal.prerequisites || isRequirementSatisfied(state, animal.prerequisites))
  )?.id ?? null
}

export function exploreForAnimal(state: GameState): { nextState: GameState; discovered: string | null } {
  const currentDogpower = state.resourceCounts.dogpower || 0

  if(currentDogpower < EXPLORE_COST) {
    return { nextState: state, discovered: null }
  }
  let nextDogpower = currentDogpower - EXPLORE_COST
  const nextAnimal = getNextUndiscoveredAnimal(state)
  const nextState: GameState = {
    ...state,
    resourceCounts: { ...state.resourceCounts, dogpower: nextDogpower },
  }

  if (nextAnimal) {
    return {
      nextState: {
        ...nextState,
        discoveredAnimalIds: [...nextState.discoveredAnimalIds, nextAnimal],
      },
      discovered: nextAnimal,
    }
  }

  nextDogpower += EXPLORE_REFUND
  return {
    nextState: {
      ...state,
      resourceCounts: { ...state.resourceCounts, dogpower: nextDogpower },
    },
    discovered: null,
  }
}
