import { beforeEach, describe, expect, it } from 'vitest'
import { type GameState, type WorkshopUnlock } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  canUnlockWorkshopItem,
  getVisibleWorkshopUnlockIds,
  unlockWorkshopItem,
  getWorkshopUnlockById,
  isWorkshopUnlockUnlocked,
  isWorkshopUnlockVisible,
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
    const baselineStone = baseline.stone || 0
    expect(production.stone).toBeCloseTo(baselineStone * 1.5)
  })

  it('should throw error when getting non-existent workshop unlock', () => {
    expect(() => getWorkshopUnlockById('non_existent_id')).toThrow('不存在')
  })

  it('should throw error for canUnlockWorkshopItem when unlock does not exist', () => {
    expect(() => canUnlockWorkshopItem(gameState, 'non_existent_id')).toThrow('不存在')
  })

  it('should return false for canUnlockWorkshopItem when already unlocked', () => {
    gameState.workshopUnlockIds = ['wood_pickaxe']
    const result = canUnlockWorkshopItem(gameState, 'wood_pickaxe')
    expect(result).toBe(false)
  })

  it('should return false for canUnlockWorkshopItem when prerequisites not met', () => {
    const result = canUnlockWorkshopItem(gameState, 'wood_pickaxe')
    expect(result).toBe(false)
  })

  it('should return false for canUnlockWorkshopItem when resources insufficient', () => {
    gameState.buildings.workshop = 1
    gameState.researchedTechIds = ['mining']
    gameState.resourceCounts.wood = 0
    gameState.resourceCounts.science = 0

    const result = canUnlockWorkshopItem(gameState, 'wood_pickaxe')
    expect(result).toBe(false)
  })

  it('should throw error when unlocking with insufficient resources', () => {
    gameState.buildings.workshop = 1
    gameState.researchedTechIds = ['mining']
    gameState.resourceCounts.wood = 10
    gameState.resourceCounts.science = 10

    expect(() => unlockWorkshopItem(gameState, 'wood_pickaxe')).toThrow('资源')
  })

  it('should throw error when unlocking without prerequisites', () => {
    expect(() => unlockWorkshopItem(gameState, 'wood_pickaxe')).toThrow('前置条件未满足')
  })

  it('should check isWorkshopUnlockUnlocked correctly', () => {
    expect(isWorkshopUnlockUnlocked(gameState, 'wood_pickaxe')).toBe(false)
    
    gameState.workshopUnlockIds = ['wood_pickaxe']
    expect(isWorkshopUnlockUnlocked(gameState, 'wood_pickaxe')).toBe(true)
  })

  it('should check isWorkshopUnlockVisible correctly', () => {
    const woodPickaxe = {
      id: 'wood_pickaxe',
      prerequisites: { requiredBuildings: ['workshop'], requiredTechs: ['mining'] }
    } as WorkshopUnlock
    
    expect(isWorkshopUnlockVisible(gameState, woodPickaxe)).toBe(false)
    
    gameState.buildings.workshop = 1
    gameState.researchedTechIds = ['mining']
    
    expect(isWorkshopUnlockVisible(gameState, woodPickaxe)).toBe(true)
    
    gameState.workshopUnlockIds = ['wood_pickaxe']
    expect(isWorkshopUnlockVisible(gameState, woodPickaxe)).toBe(true)
  })
})
describe('Workshop - Additional Coverage', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  it('getWorkshopUnlockById should throw for non-existent id', () => {
    expect(() => getWorkshopUnlockById('invalid_id')).toThrow('工坊项目 invalid_id 不存在')
  })

  it('isWorkshopUnlockVisible should return true when already unlocked', () => {
    gameState.workshopUnlockIds = ['wood_pickaxe']
    const woodPickaxe = {
      id: 'wood_pickaxe',
      prerequisites: { requiredBuildings: ['workshop'], requiredTechs: ['mining'] }
    } as WorkshopUnlock
    
    const result = isWorkshopUnlockVisible(gameState, woodPickaxe)
    expect(result).toBe(true)
  })

  it('isWorkshopUnlockVisible should return false when not unlocked and prerequisites not met', () => {
    const woodPickaxe = {
      id: 'wood_pickaxe',
      prerequisites: { requiredBuildings: ['workshop'], requiredTechs: ['mining'] }
    } as WorkshopUnlock
    
    const result = isWorkshopUnlockVisible(gameState, woodPickaxe)
    expect(result).toBe(false)
  })

  it('canUnlockWorkshopItem should check resources correctly', () => {
    gameState.buildings.workshop = 1
    gameState.researchedTechIds = ['mining']
    gameState.resourceCounts.wood = 50
    gameState.resourceCounts.science = 50
    
    const result = canUnlockWorkshopItem(gameState, 'wood_pickaxe')
    expect(result).toBe(false)
  })

  it('canUnlockWorkshopItem should return true when all conditions met', () => {
    gameState.buildings.workshop = 1
    gameState.researchedTechIds = ['mining']
    gameState.resourceCounts.wood = 100
    gameState.resourceCounts.science = 100
    
    const result = canUnlockWorkshopItem(gameState, 'wood_pickaxe')
    expect(result).toBe(true)
  })

  it('canUnlockWorkshopItem should return false when already unlocked', () => {
    gameState.buildings.workshop = 1
    gameState.researchedTechIds = ['mining']
    gameState.resourceCounts.wood = 100
    gameState.resourceCounts.science = 100
    gameState.workshopUnlockIds = ['wood_pickaxe']
    
    const result = canUnlockWorkshopItem(gameState, 'wood_pickaxe')
    expect(result).toBe(false)
  })
})