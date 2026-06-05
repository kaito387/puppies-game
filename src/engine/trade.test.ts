import { describe, it, expect, beforeEach } from 'vitest'
import {
  canExecuteTrade,
  executeTrade,
  exploreForAnimal,
  isAnimalDiscovered,
  getEmbassyLevel,
  getTradeById,
} from '@/engine/trade'
import { type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import { EXPLORE_COST, EXPLORE_REFUND } from '@/engine/constants'
function withResources(state: GameState, resources: Record<string, number>): GameState {
  return {
    ...state,
    resourceCounts: { ...state.resourceCounts, ...resources },
  }
}
function withBuildings(state: GameState, buildings: Record<string, number>): GameState {
  return {
    ...state,
    buildings: { ...state.buildings, ...buildings },
  }
}
function withDiscovered(state: GameState, animalIds: string[]): GameState {
  return {
    ...state,
    discoveredAnimalIds: animalIds,
  }
}
function withSeason(state: GameState, season: 'spring' | 'summer' | 'autumn' | 'winter'): GameState {
  const TICKS_PER_MONTH = 30 * 15
  const offsets: Record<string, number> = {
    spring: 0,
    summer: 3 * TICKS_PER_MONTH,
    autumn: 6 * TICKS_PER_MONTH,
    winter: 9 * TICKS_PER_MONTH,
  }
  return { ...state, tickCount: offsets[season] }
}
function withPopulation(state: GameState, count: number): GameState {
  return {
    ...state,
    dogs: Array.from({ length: count }, (_, i) => ({
      id: `dog-${i}`,
      name: `Dog ${i}`,
      color: '#fff',
      age: 1,
      experienceByJob: {},
      traitId: 'scientist',
      status: 'idle' as const,
      currentJobId: null,
    })),
  }
}
describe('Trade Engine', () => {
  let gameState: GameState
  beforeEach(() => {
    gameState = createInitialGameState()
  })
  describe('getTradeById', () => {
    it('should return the trade for a known id', () => {
      const trade = getTradeById('cats')
      expect(trade.id).toBe('cats')
    })
    it('should throw for an unknown trade id', () => {
      expect(() => getTradeById('nonexistent')).toThrow('贸易 nonexistent 不存在')
    })
  })
  describe('getEmbassyLevel', () => {
    it('should return 0 when no embassy has been built', () => {
      expect(getEmbassyLevel(gameState, 'cats')).toBe(0)
    })
    it('should return the correct count after building the embassy', () => {
      gameState = withBuildings(gameState, { embassy_cats: 5 })
      expect(getEmbassyLevel(gameState, 'cats')).toBe(5)
    })
  })
  describe('canExecuteTrade', () => {
    it('should return false when buy resources are insufficient', () => {
      gameState = withResources(gameState, { wood: 10 })
      expect(canExecuteTrade(gameState, 'cats')).toBe(false)
    })
    it('should return true when buy resources are exactly met', () => {
      gameState = withResources(gameState, { wood: 50 })
      expect(canExecuteTrade(gameState, 'cats')).toBe(true)
    })
    it('should return true when buy resources exceed the required amount', () => {
      gameState = withResources(gameState, { wood: 200 })
      expect(canExecuteTrade(gameState, 'cats')).toBe(true)
    })
  })
  describe('executeTrade – prerequisites', () => {
    it('should throw when minPopulation prerequisite is not met', () => {
      gameState = withResources(gameState, { wood: 50 })
      expect(() => executeTrade(gameState, 'cats')).toThrow('贸易 cats 前置条件未满足')
    })
    it('should throw when minPopulation is partially met (below threshold)', () => {
      gameState = withPopulation(gameState, 3)
      gameState = withResources(gameState, { wood: 50 })
      expect(() => executeTrade(gameState, 'cats')).toThrow('贸易 cats 前置条件未满足')
    })
    it('should throw for lizards when population meets cats threshold but not lizards', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { iron: 50 })
      expect(() => executeTrade(gameState, 'lizards')).toThrow('贸易 lizards 前置条件未满足')
    })
    it('should not throw when prerequisite is exactly met', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { wood: 50 })
      expect(() => executeTrade(gameState, 'cats')).not.toThrow()
    })
  })
  describe('executeTrade – resource deduction', () => {
    it('should deduct buy resources on a successful trade', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { wood: 50 })
      const next = executeTrade(gameState, 'cats')
      expect(next.resourceCounts.wood).toBe(0)
    })
    it('should throw when buy resources are insufficient', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { wood: 10 })
      expect(() => executeTrade(gameState, 'cats')).toThrow()
    })
    it('should not mutate the original state', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { wood: 50 })
      const originalWood = gameState.resourceCounts.wood
      executeTrade(gameState, 'cats')
      expect(gameState.resourceCounts.wood).toBe(originalWood)
    })
  })
  describe('executeTrade – base sell quantity', () => {
    it('should grant base sell resources at embassy level 0, season-multiplier = 1 (summer cats)', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'summer')
      gameState = withResources(gameState, { wood: 50, food: 0 })
      const next = executeTrade(gameState, 'cats')
      expect(next.resourceCounts.food).toBeCloseTo(200 * 1 * 1, 5)
    })
    it('should apply the spring season multiplier for cats (1.1)', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'spring')
      gameState = withResources(gameState, { wood: 50, food: 0 })
      const next = executeTrade(gameState, 'cats')
      expect(next.resourceCounts.food).toBeCloseTo(200 * 1.1, 5)
    })
    it('should apply the winter season penalty for cats (0.7)', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'winter')
      gameState = withResources(gameState, { wood: 50, food: 0 })
      const next = executeTrade(gameState, 'cats')
      expect(next.resourceCounts.food).toBeCloseTo(200 * 0.7, 5)
    })
  })
  describe('executeTrade – embassy linear quantity bonus', () => {
    it('should apply no bonus at embassy level 0 (quantityBonus equals season multiplier only)', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'summer')
      gameState = withResources(gameState, { wood: 50, food: 0 })
      const next = executeTrade(gameState, 'cats')
      expect(next.resourceCounts.food).toBeCloseTo(200 * 1, 5)
    })
    it('should scale sell quantity linearly with embassy level', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'summer')
      gameState = withBuildings(gameState, { embassy_cats: 4 })
      gameState = withResources(gameState, { wood: 50, food: 0 })
      const next = executeTrade(gameState, 'cats')
      const expected = 200 * (1 + 0.05 * 4) * 1
      expect(next.resourceCounts.food).toBeCloseTo(expected, 5)
    })
    it('should stack embassy bonus with season multiplier', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'spring')
      gameState = withBuildings(gameState, { embassy_cats: 6 })
      gameState = withResources(gameState, { wood: 50, food: 0 })
      const next = executeTrade(gameState, 'cats')
      const expected = 200 * (1 + 0.05 * 6) * 1.1
      expect(next.resourceCounts.food).toBeCloseTo(expected, 5)
    })
  })
  describe('executeTrade – level unlocks (5 / 10 / 15)', () => {
    it('should NOT grant level-unlock resources when embassy is below threshold', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'summer')
      gameState = withBuildings(gameState, { embassy_cats: 4 })
      gameState = withResources(gameState, { wood: 50, stone: 0 })
      const next = executeTrade(gameState, 'cats')
      expect(next.resourceCounts.stone).toBe(0)
    })
    it('should grant level-5 unlock resources when embassy is exactly 5', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'summer')
      gameState = withBuildings(gameState, { embassy_cats: 5 })
      gameState = withResources(gameState, { wood: 50, stone: 0 })
      const next = executeTrade(gameState, 'cats')
      const expected = 50 * (1 + 0.05 * 5) * 1
      expect(next.resourceCounts.stone).toBeCloseTo(expected, 5)
    })
    it('should grant both level-5 and level-10 unlock resources when embassy is 10', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withSeason(gameState, 'summer')
      gameState = withBuildings(gameState, { embassy_cats: 10 })
      gameState = withResources(gameState, { wood: 50, stone: 0, coal: 0 })
      const next = executeTrade(gameState, 'cats')
      const bonus = (1 + 0.05 * 10) * 1
      expect(next.resourceCounts.stone).toBeCloseTo(50 * bonus, 5)
      expect(next.resourceCounts.coal).toBeCloseTo(30 * bonus, 5)
    })
    it('should grant level-5 unlock for lizards (coal) at embassy level 5', () => {
      gameState = withPopulation(gameState, 10)
      gameState = withSeason(gameState, 'summer')
      gameState = withBuildings(gameState, { embassy_lizards: 5 })
      gameState = withResources(gameState, { iron: 50, coal: 0 })
      const next = executeTrade(gameState, 'lizards')
      const bonus = (1 + 0.05 * 5) * 1.2
      expect(next.resourceCounts.coal).toBeCloseTo(30 * bonus, 5)
    })
  })
  describe('isAnimalDiscovered', () => {
    it('should return false for an undiscovered animal', () => {
      expect(isAnimalDiscovered(gameState, 'cats')).toBe(false)
    })
    it('should return true after the animal is added to discoveredAnimalIds', () => {
      gameState = withDiscovered(gameState, ['cats'])
      expect(isAnimalDiscovered(gameState, 'cats')).toBe(true)
    })
    it('should return false for a different animal when only one is discovered', () => {
      gameState = withDiscovered(gameState, ['cats'])
      expect(isAnimalDiscovered(gameState, 'lizards')).toBe(false)
    })
  })
  describe('exploreForAnimal – dogpower cost and refund', () => {
    it('should not deduct dogpower when dogpower is below EXPLORE_COST', () => {
      gameState = withResources(gameState, { dogpower: EXPLORE_COST - 1 })
      const { nextState, discovered } = exploreForAnimal(gameState)
      expect(discovered).toBeNull()
      expect(nextState.resourceCounts.dogpower).toBe(EXPLORE_COST - 1)
    })
    it('should deduct EXPLORE_COST and discover the first eligible animal', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { dogpower: EXPLORE_COST })
      const { nextState, discovered } = exploreForAnimal(gameState)
      expect(discovered).toBe('cats')
      expect(nextState.resourceCounts.dogpower).toBe(0)
      expect(nextState.discoveredAnimalIds).toContain('cats')
    })
    it('should refund EXPLORE_REFUND when no eligible animal exists (none discovered, prerequisites unmet)', () => {
      gameState = withResources(gameState, { dogpower: EXPLORE_COST })
      const { nextState, discovered } = exploreForAnimal(gameState)
      expect(discovered).toBeNull()
      expect(nextState.resourceCounts.dogpower).toBe(EXPLORE_REFUND)
    })
    it('should refund EXPLORE_REFUND when all eligible animals are already discovered', () => {
      gameState = withPopulation(gameState, 10)
      gameState = withDiscovered(gameState, ['cats', 'lizards'])
      gameState = withResources(gameState, { dogpower: EXPLORE_COST })
      const { nextState, discovered } = exploreForAnimal(gameState)
      expect(discovered).toBeNull()
      expect(nextState.resourceCounts.dogpower).toBe(EXPLORE_REFUND)
    })
  })
  describe('exploreForAnimal – discovery persistence', () => {
    it('should persistently add the discovered animal to discoveredAnimalIds', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { dogpower: EXPLORE_COST * 3 })
      const { nextState: s1 } = exploreForAnimal(gameState)
      expect(s1.discoveredAnimalIds).toContain('cats')
      const { nextState: s2, discovered: d2 } = exploreForAnimal(s1)
      expect(s2.discoveredAnimalIds).toContain('cats')
      expect(d2).toBeNull()
    })
    it('should not mutate the original state discoveredAnimalIds', () => {
      gameState = withPopulation(gameState, 5)
      gameState = withResources(gameState, { dogpower: EXPLORE_COST })
      const originalIds = [...gameState.discoveredAnimalIds]
      exploreForAnimal(gameState)
      expect(gameState.discoveredAnimalIds).toEqual(originalIds)
    })
  })
  describe('executeTrade – season variation summary', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'] as const
    const expectedMultipliers: Record<string, number> = {
      spring: 1.1,
      summer: 1.0,
      autumn: 1.15,
      winter: 0.7,
    }
    it.each(seasons)('cats food sell quantity in %s matches expected multiplier', (season) => {
      const s = withSeason(
        withResources(withPopulation(gameState, 5), { wood: 50, food: 0 }),
        season,
      )
      const next = executeTrade(s, 'cats')
      expect(next.resourceCounts.food).toBeCloseTo(200 * expectedMultipliers[season], 5)
    })
  })
})