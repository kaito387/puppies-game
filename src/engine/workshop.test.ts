import { beforeEach, describe, expect, it } from 'vitest'
import { type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  canUnlockWorkshopItem,
  getVisibleWorkshopUnlockIds,
  unlockWorkshopItem,
} from '@/engine/workshop'
import { calculateJobProduction } from '@/engine/gameLoop'
import { createDogs } from '@/engine/dogs'

describe('Workshop', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  it('should hide workshop items before prerequisites are met', () => {
    const visibleIds = getVisibleWorkshopUnlockIds(gameState)
    expect(visibleIds).toEqual([])
  })

  it('should require workshop building and mining tech for wood pickaxe', () => {
    gameState.resourceCounts.wood = 100
    gameState.resourceCounts.science = 100

    expect(canUnlockWorkshopItem(gameState, 'wood_pickaxe')).toBe(false)

    gameState.buildings.workshop = 1
    expect(canUnlockWorkshopItem(gameState, 'wood_pickaxe')).toBe(false)

    gameState.researchedTechIds = ['mining']
    expect(canUnlockWorkshopItem(gameState, 'wood_pickaxe')).toBe(true)
  })

  it('should unlock wood pickaxe once and deduct resources', () => {
    gameState.buildings.workshop = 1
    gameState.researchedTechIds = ['mining']
    gameState.resourceCounts.wood = 80
    gameState.resourceCounts.science = 60

    const unlocked = unlockWorkshopItem(gameState, 'wood_pickaxe')

    expect(unlocked.workshopUnlockIds).toEqual(['wood_pickaxe'])
    expect(unlocked.resourceCounts.wood).toBe(0)
    expect(unlocked.resourceCounts.science).toBe(0)
    expect(() => unlockWorkshopItem(unlocked, 'wood_pickaxe')).toThrow('已经解锁')
  })

  it('should apply stone pickaxe bonus to miner production', () => {
    gameState.dogs = createDogs(1)
    gameState.dogs[0].currentJobId = 'miner'
    gameState.dogs[0].status = 'working'
    gameState.dogs[0].traitId = 'farmer'

    const baseline = calculateJobProduction(gameState)

    gameState.workshopUnlockIds = ['stone_pickaxe']

    const production = calculateJobProduction(gameState)
    expect(production.stone).toBeCloseTo((baseline.stone || 0) * 1.5)
  })
})