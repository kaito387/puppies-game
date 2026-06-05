import { beforeEach, describe, expect, it } from 'vitest'
import { ANIMALS, type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  calculateBuyCosts,
  calculateSellAmounts,
  canUpgradeEmbassy,
  exploreTradeAnimal,
  getAnimalById,
  getAnimalEffectiveSellResources,
  getAnimalSeasonMultiplier,
  getAvailableAnimals,
  getEmbassyLevel,
  getEmbassyUpgradeCost,
  getUndiscoveredEligibleAnimals,
  isAnimalDiscovered,
  tradeWithAnimal,
  upgradeEmbassy,
} from '@/engine/trade'

describe('Trade - Helpers', () => {
  it('getAnimalById should return correct animal', () => {
    const rabbit = getAnimalById('rabbit')
    expect(rabbit.id).toBe('rabbit')
    expect(rabbit.name).toBe('兔子')
  })

  it('getAnimalById should throw for unknown animal', () => {
    expect(() => getAnimalById('nonexistent')).toThrow('动物 nonexistent 不存在')
  })

  it('isAnimalDiscovered should return false for undiscovered animal', () => {
    const state = createInitialGameState()
    expect(isAnimalDiscovered(state, 'rabbit')).toBe(false)
  })

  it('isAnimalDiscovered should return true for discovered animal', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    expect(isAnimalDiscovered(state, 'rabbit')).toBe(true)
  })

  it('getEmbassyLevel should return 0 for never-upgraded embassy', () => {
    const state = createInitialGameState()
    expect(getEmbassyLevel(state, 'rabbit')).toBe(0)
  })

  it('getEmbassyLevel should return correct level', () => {
    const state = createInitialGameState()
    state.embassyLevels = { rabbit: 3 }
    expect(getEmbassyLevel(state, 'rabbit')).toBe(3)
  })

  it('getAnimalSeasonMultiplier should return season-specific multiplier', () => {
    const rabbit = getAnimalById('rabbit')
    expect(getAnimalSeasonMultiplier(rabbit, 'spring')).toBe(1.2)
    expect(getAnimalSeasonMultiplier(rabbit, 'summer')).toBe(1.0)
    expect(getAnimalSeasonMultiplier(rabbit, 'autumn')).toBe(1.0)
    expect(getAnimalSeasonMultiplier(rabbit, 'winter')).toBe(0.5)
  })
})

describe('Trade - Embassy', () => {
  let state: GameState

  beforeEach(() => {
    state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
  })

  it('getAnimalEffectiveSellResources should return base resources at level 0', () => {
    const resources = getAnimalEffectiveSellResources(state, 'rabbit')
    expect(resources).toEqual({ fur: 30 })
  })

  it('getAnimalEffectiveSellResources should include embassy unlocks at level 5', () => {
    state.embassyLevels = { rabbit: 5 }
    const resources = getAnimalEffectiveSellResources(state, 'rabbit')
    expect(resources.fur).toBe(30)
    expect(resources.gold).toBe(3)
  })

  it('getAnimalEffectiveSellResources should include embassy unlocks at level 10', () => {
    state.embassyLevels = { rabbit: 10 }
    const resources = getAnimalEffectiveSellResources(state, 'rabbit')
    expect(resources.fur).toBe(30)
    expect(resources.gold).toBe(3)
    expect(resources.culture).toBe(5)
  })

  it('getAnimalEffectiveSellResources should include all embassy unlocks at level 15', () => {
    state.embassyLevels = { rabbit: 15 }
    const resources = getAnimalEffectiveSellResources(state, 'rabbit')
    expect(resources.fur).toBe(30)
    expect(resources.gold).toBe(3)
    expect(resources.culture).toBe(5)
    expect(resources.science).toBe(8)
  })

  it('getAnimalEffectiveSellResources should include unlocks at level above threshold', () => {
    state.embassyLevels = { rabbit: 7 }
    const resources = getAnimalEffectiveSellResources(state, 'rabbit')
    expect(resources.gold).toBe(3)
    // level 10+ not unlocked yet
    expect(resources.culture).toBeUndefined()
    expect(resources.science).toBeUndefined()
  })

  it('getEmbassyUpgradeCost should compute exponential cost', () => {
    // Rabbit base: wood=500, food=300, culture=100
    // Level 0: ceil(500*1.2^0)=500, ceil(300*1.2^0)=300, ceil(100*1.2^0)=100
    const cost0 = getEmbassyUpgradeCost(state, 'rabbit')
    expect(cost0.wood).toBe(500)
    expect(cost0.food).toBe(300)
    expect(cost0.culture).toBe(100)

    // Level 1: ceil(500*1.2^1)=ceil(600)=600, ceil(300*1.2)=ceil(360)=360, ceil(100*1.2)=ceil(120)=120
    state.embassyLevels = { rabbit: 1 }
    const cost1 = getEmbassyUpgradeCost(state, 'rabbit')
    expect(cost1.wood).toBe(600)
    expect(cost1.food).toBe(360)
    expect(cost1.culture).toBe(120)

    // Level 5: ceil(500*1.2^5)=ceil(500*2.48832)=ceil(1244.16)=1245
    state.embassyLevels = { rabbit: 5 }
    const cost5 = getEmbassyUpgradeCost(state, 'rabbit')
    expect(cost5.wood).toBe(1245)
  })

  it('canUpgradeEmbassy should return false when not discovered', () => {
    const s = createInitialGameState()
    expect(canUpgradeEmbassy(s, 'rabbit')).toBe(false)
  })

  it('canUpgradeEmbassy should return false when resources insufficient', () => {
    expect(canUpgradeEmbassy(state, 'rabbit')).toBe(false)
  })

  it('canUpgradeEmbassy should return true when resources sufficient', () => {
    state.resourceCounts = { wood: 500, food: 300, culture: 100 }
    expect(canUpgradeEmbassy(state, 'rabbit')).toBe(true)
  })

  it('upgradeEmbassy should throw when not discovered', () => {
    const s = createInitialGameState()
    expect(() => upgradeEmbassy(s, 'rabbit')).toThrow('尚未发现动物 rabbit')
  })

  it('upgradeEmbassy should throw when resources insufficient', () => {
    expect(() => upgradeEmbassy(state, 'rabbit')).toThrow('资源')
  })

  it('upgradeEmbassy should deduct resources and increment level', () => {
    state.resourceCounts = { wood: 500, food: 300, culture: 100 }
    const next = upgradeEmbassy(state, 'rabbit')
    expect(next.embassyLevels.rabbit).toBe(1)
    expect(next.resourceCounts.wood).toBe(0)
    expect(next.resourceCounts.food).toBe(0)
    expect(next.resourceCounts.culture).toBe(0)
  })

  it('upgradeEmbassy should not mutate original state', () => {
    state.resourceCounts = { wood: 500, food: 300, culture: 100 }
    const originalLevel = state.embassyLevels.rabbit
    upgradeEmbassy(state, 'rabbit')
    expect(state.embassyLevels.rabbit).toBe(originalLevel)
  })
})

describe('Trade - Season & Embassy Quantity Calculation', () => {
  it('calculateSellAmounts should apply season multiplier', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.tickCount = 0 // spring (CALENDAR_START_MONTH=3)
    // rabbit spring bonus = 1.2, base fur=30, embassy level 0 => floor(30*1.2*1) = 36
    const amounts = calculateSellAmounts(state, 'rabbit')
    expect(amounts.fur).toBe(36)
  })

  it('calculateSellAmounts should apply summer season multiplier', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    // Each month = 30 days * 15 ticks = 450 ticks
    // Summer starts month 6. From month 3 to 6 = 3 months = 90 days = 1350 ticks
    state.tickCount = 1350 // month 6 (summer)
    // rabbit summer bonus = 1.0, base fur=30 => floor(30*1.0*1) = 30
    const amounts = calculateSellAmounts(state, 'rabbit')
    expect(amounts.fur).toBe(30)
  })

  it('calculateSellAmounts should apply winter penalty', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['fox']
    // Winter: fox bonus = 1.5, base fur=25, gold=5
    // Month 12 = winter, from month 3 to 12 = 9 months = 270 days = 4050 ticks
    state.tickCount = 4050 // month 12 (winter)
    const amounts = calculateSellAmounts(state, 'fox')
    // floor(25*1.5*1) = 37, floor(5*1.5*1) = 7
    expect(amounts.fur).toBe(37)
    expect(amounts.gold).toBe(7)
  })

  it('calculateSellAmounts should apply embassy linear bonus (+5% per level)', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.embassyLevels = { rabbit: 10 }
    state.tickCount = 1350 // summer, rabbit bonus=1.0
    // base fur=30, season=1.0, embassy multiplier=1+10*0.05=1.5
    // floor(30*1.0*1.5) = 45
    const amounts = calculateSellAmounts(state, 'rabbit')
    expect(amounts.fur).toBe(45)
  })

  it('calculateSellAmounts should combine season and embassy multipliers', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.embassyLevels = { rabbit: 5 }
    state.tickCount = 0 // spring, rabbit bonus=1.2
    // base fur=30, season=1.2, embassy=1+5*0.05=1.25
    // floor(30*1.2*1.25) = floor(45) = 45
    const amounts = calculateSellAmounts(state, 'rabbit')
    expect(amounts.fur).toBe(45)
  })

  it('calculateSellAmounts should include embassy-unlocked resources with multipliers', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.embassyLevels = { rabbit: 5 }
    state.tickCount = 1350 // summer, rabbit bonus=1.0
    // fur: floor(30*1.0*1.25)=37, gold: floor(3*1.0*1.25)=3
    const amounts = calculateSellAmounts(state, 'rabbit')
    expect(amounts.fur).toBe(37)
    expect(amounts.gold).toBe(3)
  })

  it('calculateSellAmounts should floor the result', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.embassyLevels = { rabbit: 3 }
    state.tickCount = 0 // spring
    // fur: floor(30*1.2*(1+3*0.05)) = floor(30*1.2*1.15) = floor(41.4) = 41
    const amounts = calculateSellAmounts(state, 'rabbit')
    expect(amounts.fur).toBe(41)
  })
})

describe('Trade - Season Multipliers for Different Animals', () => {
  it('bear should have summer peak', () => {
    const bear = ANIMALS.find((a) => a.id === 'bear')!
    expect(getAnimalSeasonMultiplier(bear, 'summer')).toBe(1.5)
    expect(getAnimalSeasonMultiplier(bear, 'winter')).toBe(0.5)
  })

  it('fox should have winter peak', () => {
    const fox = ANIMALS.find((a) => a.id === 'fox')!
    expect(getAnimalSeasonMultiplier(fox, 'winter')).toBe(1.5)
    expect(getAnimalSeasonMultiplier(fox, 'summer')).toBe(0.5)
  })

  it('eagle should have autumn peak', () => {
    const eagle = ANIMALS.find((a) => a.id === 'eagle')!
    expect(getAnimalSeasonMultiplier(eagle, 'autumn')).toBe(1.3)
    expect(getAnimalSeasonMultiplier(eagle, 'winter')).toBe(0.3)
  })

  it('season multiplier should show varying quantities across seasons for rabbit', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']

    // Spring (tick 0, month 3)
    state.tickCount = 0
    const springAmounts = calculateSellAmounts(state, 'rabbit')
    expect(springAmounts.fur).toBe(36) // floor(30*1.2)

    // Summer (tick 1350, month 6)
    state.tickCount = 1350
    const summerAmounts = calculateSellAmounts(state, 'rabbit')
    expect(summerAmounts.fur).toBe(30) // floor(30*1.0)

    // Autumn (tick 2700, month 9)
    state.tickCount = 2700
    const autumnAmounts = calculateSellAmounts(state, 'rabbit')
    expect(autumnAmounts.fur).toBe(30) // floor(30*1.0)

    // Winter (tick 4050, month 12)
    state.tickCount = 4050
    const winterAmounts = calculateSellAmounts(state, 'rabbit')
    expect(winterAmounts.fur).toBe(15) // floor(30*0.5)
  })
})

describe('Trade - Exploration', () => {
  let state: GameState

  beforeEach(() => {
    state = createInitialGameState()
    state.resourceCounts.dogpower = 2000
    // rabbit needs farm
    state.buildings.farm = 1
  })

  it('should block exploration when dogpower insufficient', () => {
    state.resourceCounts.dogpower = 500
    const result = exploreTradeAnimal(state)
    expect(result.blockedReason).toBe('insufficientDogpower')
    expect(result.nextState).toBe(state) // unchanged
  })

  it('should deduct 1000 dogpower on exploration', () => {
    const result = exploreTradeAnimal(state)
    expect(result.nextState.resourceCounts.dogpower).toBe(1000)
  })

  it('should discover first eligible animal (rabbit)', () => {
    const result = exploreTradeAnimal(state)
    expect(result.discoveredAnimal?.id).toBe('rabbit')
    expect(result.nextState.discoveredAnimals).toContain('rabbit')
  })

  it('should discover animals in definition order', () => {
    // First discover rabbit
    const r1 = exploreTradeAnimal(state)
    expect(r1.discoveredAnimal?.id).toBe('rabbit')

    // Set up for bear (needs barn)
    const s = r1.nextState
    s.buildings.barn = 1
    s.resourceCounts.dogpower = 2000

    const r2 = exploreTradeAnimal(s)
    expect(r2.discoveredAnimal?.id).toBe('bear')
  })

  it('should discover all animals in order given all prerequisites met', () => {
    // Set up all prerequisites
    state.buildings.farm = 1
    state.buildings.barn = 1
    state.buildings.library = 1
    state.buildings.workshop = 1

    const expectedOrder = ['rabbit', 'bear', 'fox', 'eagle']
    let s = state
    for (const expectedId of expectedOrder) {
      s.resourceCounts.dogpower = 2000
      const result = exploreTradeAnimal(s)
      expect(result.discoveredAnimal?.id).toBe(expectedId)
      s = result.nextState
    }
  })

  it('should persist discovered animals across explorations', () => {
    const r1 = exploreTradeAnimal(state)
    expect(r1.nextState.discoveredAnimals).toEqual(['rabbit'])
    // dogpower was deducted: 2000 - 1000 = 1000
    // Need to refill for next exploration
    r1.nextState.resourceCounts.dogpower = 2000

    // Set up bear prerequisite
    r1.nextState.buildings.barn = 1
    const r2 = exploreTradeAnimal(r1.nextState)
    expect(r2.nextState.discoveredAnimals).toEqual(['rabbit', 'bear'])
  })

  it('should refund 900 dogpower when all eligible animals are discovered', () => {
    // Discover all 4 animals
    state.buildings.barn = 1
    state.buildings.library = 1
    state.buildings.workshop = 1
    state.discoveredAnimals = ['rabbit', 'bear', 'fox', 'eagle']
    state.resourceCounts.dogpower = 2000

    const result = exploreTradeAnimal(state)
    // Net cost: 2000 - 1000 + 900 = 1900
    expect(result.allDiscovered).toBe(true)
    expect(result.nextState.resourceCounts.dogpower).toBe(1900)
    expect(result.discoveredAnimal).toBeUndefined()
  })

  it('should not discover animals whose prerequisites are not met', () => {
    // Only farm is built, so only rabbit is eligible
    state.buildings.farm = 1
    // No barn, no library, no workshop

    const result = exploreTradeAnimal(state)
    expect(result.discoveredAnimal?.id).toBe('rabbit')

    // After discovering rabbit, no more eligible animals
    result.nextState.resourceCounts.dogpower = 2000
    const r2 = exploreTradeAnimal(result.nextState)
    expect(r2.allDiscovered).toBe(true)
  })
})

describe('Trade - getAvailableAnimals / getUndiscoveredEligibleAnimals', () => {
  it('getAvailableAnimals should return only discovered animals', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit', 'bear']
    const available = getAvailableAnimals(state)
    expect(available).toHaveLength(2)
    expect(available.map((a) => a.id)).toEqual(['rabbit', 'bear'])
  })

  it('getAvailableAnimals should return empty when none discovered', () => {
    const state = createInitialGameState()
    expect(getAvailableAnimals(state)).toHaveLength(0)
  })

  it('getUndiscoveredEligibleAnimals should return animals with satisfied prerequisites', () => {
    const state = createInitialGameState()
    state.buildings.farm = 1
    const eligible = getUndiscoveredEligibleAnimals(state)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].id).toBe('rabbit')
  })

  it('getUndiscoveredEligibleAnimals should exclude already discovered', () => {
    const state = createInitialGameState()
    state.buildings.farm = 1
    state.discoveredAnimals = ['rabbit']
    const eligible = getUndiscoveredEligibleAnimals(state)
    expect(eligible).toHaveLength(0)
  })

  it('getUndiscoveredEligibleAnimals should filter by prerequisites', () => {
    const state = createInitialGameState()
    // No buildings built - no animals eligible
    const eligible = getUndiscoveredEligibleAnimals(state)
    expect(eligible).toHaveLength(0)
  })
})

describe('Trade - Trade Execution', () => {
  it('tradeWithAnimal should block when animal not discovered', () => {
    const state = createInitialGameState()
    const result = tradeWithAnimal(state, 'rabbit')
    expect(result.blockedReason).toBe('notDiscovered')
  })

  it('tradeWithAnimal should block when resources insufficient', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    // rabbit buyCosts: food=50, we have 0
    const result = tradeWithAnimal(state, 'rabbit')
    expect(result.blockedReason).toBe('insufficientResources')
  })

  it('tradeWithAnimal should deduct buy costs and add sell resources', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.resourceCounts.food = 200
    state.tickCount = 1350 // summer, rabbit bonus=1.0, fur=30

    const result = tradeWithAnimal(state, 'rabbit')
    expect(result.blockedReason).toBeUndefined()
    expect(result.paid.food).toBe(50)
    expect(result.gained.fur).toBe(30)
    expect(result.nextState.resourceCounts.food).toBe(150)
    expect(result.nextState.resourceCounts.fur).toBe(30)
  })

  it('tradeWithAnimal should cap gains at resource limit', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.resourceCounts.food = 200
    state.resourceCounts.fur = 1490 // limit is 1500 for fur
    state.tickCount = 0 // spring, fur=36

    const result = tradeWithAnimal(state, 'rabbit')
    // Should only gain 10 fur (1500 - 1490), not the full 36
    expect(result.gained.fur).toBe(10)
    expect(result.nextState.resourceCounts.fur).toBe(1500)
  })

  it('tradeWithAnimal should handle resource at exactly limit', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.resourceCounts.food = 200
    state.resourceCounts.fur = 1500 // at limit
    state.tickCount = 0 // spring, fur=36

    const result = tradeWithAnimal(state, 'rabbit')
    expect(result.gained.fur).toBe(0)
    expect(result.nextState.resourceCounts.fur).toBe(1500)
  })

  it('tradeWithAnimal should not mutate original state', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.resourceCounts.food = 200

    tradeWithAnimal(state, 'rabbit')
    expect(state.resourceCounts.food).toBe(200) // unchanged
  })

  it('tradeWithAnimal should handle animals with multiple buy costs', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['bear']
    state.resourceCounts.food = 200
    state.resourceCounts.wood = 200
    state.tickCount = 1350 // summer, bear=1.5

    const result = tradeWithAnimal(state, 'bear')
    expect(result.blockedReason).toBeUndefined()
    expect(result.paid.food).toBe(80)
    expect(result.paid.wood).toBe(30)
    // summer: fur=floor(40*1.5)=60, stone=floor(15*1.5)=22
    expect(result.gained.fur).toBe(60)
    expect(result.gained.stone).toBe(22)
  })

  it('tradeWithAnimal should work regardless of season (seasons only affect efficiency)', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.resourceCounts.food = 200

    // Winter: rabbit bonus = 0.5
    state.tickCount = 4050 // month 12, winter
    const winterResult = tradeWithAnimal(state, 'rabbit')
    expect(winterResult.gained.fur).toBe(15) // floor(30*0.5)

    // Spring: rabbit bonus = 1.2
    state.tickCount = 0
    state.resourceCounts.food = 200
    state.resourceCounts.fur = 0
    const springResult = tradeWithAnimal(state, 'rabbit')
    expect(springResult.gained.fur).toBe(36) // floor(30*1.2)
  })

  it('tradeWithAnimal with embassy levels should increase gains', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.embassyLevels = { rabbit: 5 }
    state.resourceCounts.food = 200
    state.tickCount = 1350 // summer

    const result = tradeWithAnimal(state, 'rabbit')
    // fur: floor(30 * 1.0 * 1.25) = 37, gold: floor(3 * 1.0 * 1.25) = 3
    expect(result.gained.fur).toBe(37)
    expect(result.gained.gold).toBe(3)
  })

  it('calculateBuyCosts should not be affected by season or embassy', () => {
    const state = createInitialGameState()
    state.embassyLevels = { rabbit: 20 }
    state.tickCount = 0 // spring

    const costs = calculateBuyCosts(state, 'rabbit')
    // Always base: food=50
    expect(costs.food).toBe(50)
  })

  it('tradeWithAnimal should return empty gained for zero-amount resources', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.resourceCounts.food = 200
    state.tickCount = 4050 // winter
    state.embassyLevels = { rabbit: 0 }
    // rabbit at level 0 only produces fur, no gold/culture/science
    const result = tradeWithAnimal(state, 'rabbit')
    expect(result.gained.gold).toBeUndefined()
  })

  it('tradeWithAnimal should handle eagle unique buy/sell mix', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['eagle']
    state.resourceCounts.wood = 200
    state.resourceCounts.stone = 200
    state.tickCount = 2700 // autumn, eagle bonus=1.3

    const result = tradeWithAnimal(state, 'eagle')
    expect(result.paid.wood).toBe(60)
    expect(result.paid.stone).toBe(40)
    // floor(10*1.3)=13, floor(8*1.3)=10
    expect(result.gained.iron).toBe(13)
    expect(result.gained.gold).toBe(10)
  })
})

describe('Trade - Embassy Unlock Levels (5/10/15)', () => {
  it('rabbit embassy should unlock gold at level 5, culture at 10, science at 15', () => {
    const rabbit = getAnimalById('rabbit')
    expect(rabbit.embassyUnlocks).toBeDefined()
    const unlocks = rabbit.embassyUnlocks!
    expect(unlocks[0].level).toBe(5)
    expect(unlocks[0].sellResources.gold).toBe(3)
    expect(unlocks[1].level).toBe(10)
    expect(unlocks[1].sellResources.culture).toBe(5)
    expect(unlocks[2].level).toBe(15)
    expect(unlocks[2].sellResources.science).toBe(8)
  })

  it('bear embassy should unlock iron at level 5, gold at 10, coal at 15', () => {
    const bear = getAnimalById('bear')
    const unlocks = bear.embassyUnlocks!
    expect(unlocks[0].level).toBe(5)
    expect(unlocks[0].sellResources.iron).toBe(5)
    expect(unlocks[1].level).toBe(10)
    expect(unlocks[1].sellResources.gold).toBe(5)
    expect(unlocks[2].level).toBe(15)
    expect(unlocks[2].sellResources.coal).toBe(10)
  })

  it('fox embassy should unlock culture at level 5, science at 10, iron at 15', () => {
    const fox = getAnimalById('fox')
    const unlocks = fox.embassyUnlocks!
    expect(unlocks[0].level).toBe(5)
    expect(unlocks[0].sellResources.culture).toBe(3)
    expect(unlocks[1].level).toBe(10)
    expect(unlocks[1].sellResources.science).toBe(5)
    expect(unlocks[2].level).toBe(15)
    expect(unlocks[2].sellResources.iron).toBe(8)
  })

  it('eagle embassy should unlock coal at level 5, science at 10, culture at 15', () => {
    const eagle = getAnimalById('eagle')
    const unlocks = eagle.embassyUnlocks!
    expect(unlocks[0].level).toBe(5)
    expect(unlocks[0].sellResources.coal).toBe(5)
    expect(unlocks[1].level).toBe(10)
    expect(unlocks[1].sellResources.science).toBe(8)
    expect(unlocks[2].level).toBe(15)
    expect(unlocks[2].sellResources.culture).toBe(10)
  })

  it('embassy unlock resources should appear in trade with sufficient level', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.embassyLevels = { rabbit: 10 }
    state.resourceCounts.food = 200
    state.tickCount = 1350 // summer

    const result = tradeWithAnimal(state, 'rabbit')
    expect(result.gained.gold).toBeGreaterThan(0)
    expect(result.gained.culture).toBeGreaterThan(0)
    expect(result.gained.science).toBeUndefined() // level 15 needed
  })

  it('embassy resources should respect season multiplier', () => {
    const state = createInitialGameState()
    state.discoveredAnimals = ['rabbit']
    state.embassyLevels = { rabbit: 5 }
    state.resourceCounts.food = 200
    state.tickCount = 4050 // winter, rabbit bonus=0.5

    const result = tradeWithAnimal(state, 'rabbit')
    // fur: floor(30*0.5*1.25)=18, gold: floor(3*0.5*1.25)=floor(1.875)=1
    expect(result.gained.fur).toBe(18)
    expect(result.gained.gold).toBe(1)
  })
})
