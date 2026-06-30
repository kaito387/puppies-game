import { describe, it, expect, beforeEach } from 'vitest'
import {
  tick,
  calculateProduction,
  calculateJobProduction,
  calculatePopulationCap,
  calculateResourceLimits,
} from '@/engine/gameLoop'
import { calculateCalendarProgress } from '@/engine/calendar'
import { RESOURCES, type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
  INITIAL_RESOURCE_LIMITS,
  POPULATION_GROWTH_RATE,
  TICKS_PER_DAY,
  DAYS_PER_MONTH,
  MONTHS_PER_YEAR,
  CALENDAR_START_YEAR,
  CALENDAR_START_MONTH,
  CALENDAR_START_DAY,
} from '@/engine/constants'
import { createDogs } from '@/engine/dogs'
import { aggregateEffects } from '@/engine/technologies'

describe('Game Loop', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  function setDogs(count: number) {
    gameState.dogs = createDogs(count)
  }

  describe('Production', () => {
    it('should calculate production correctly with no buildings', () => {
      const production = calculateProduction(gameState)
      const zeroResources: Record<string, number> = Object.fromEntries(
        RESOURCES.map((r) => [r.id, 0]),
      )
      expect(production).toEqual(zeroResources)
    })

    it('should calculate production correctly with multiple buildings', () => {
      gameState.buildings.barn = 2
      gameState.buildings.farm = 3
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
      const production = calculateProduction(gameState)
      expect(production.food).toBeCloseTo(0.45)
    })

    it('should calculate job production correctly', () => {
      setDogs(3)
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[0].status = 'working'
      gameState.dogs[0].traitId = 'scientist'
      gameState.dogs[1].currentJobId = 'farmer'
      gameState.dogs[1].status = 'working'
      gameState.dogs[1].traitId = 'scientist'
      gameState.dogs[2].currentJobId = 'lumberjack'
      gameState.dogs[2].status = 'working'
      gameState.dogs[2].traitId = 'scientist'

      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(1.8)
      expect(production.wood).toBeCloseTo(0.35)
    })

    it('should skip dogs with unknown jobId silently', () => {
      setDogs(1)
      gameState.dogs[0].currentJobId = 'nonexistent-job' as string
      gameState.dogs[0].status = 'working'

      const production = calculateJobProduction(gameState)
      expect(production.food).toBe(0)
    })

    it('should calculate population cap from housing buildings', () => {
      gameState.buildings.barn = 3
      expect(calculatePopulationCap(gameState)).toBe(8)
    })

    it('should calculate resource limits with warehouse bonuses', () => {
      gameState.buildings.warehouse = 2
      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBe(INITIAL_RESOURCE_LIMITS.food + 2 * 250)
      expect(limits.wood).toBe(INITIAL_RESOURCE_LIMITS.wood + 2 * 220)
    })

    it('should apply multiplier resource_limit effect from enacted policy', () => {
      gameState.enactedPolicyIds = ['policy-environment']
      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBeCloseTo(INITIAL_RESOURCE_LIMITS.food * 1.4)
    })

    it('should apply researched tech multiplier to building production', () => {
      gameState.researchedTechIds = ['woodworking', 'crop_rotation']
      gameState.buildings.farm = 2
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6

      const production = calculateProduction(gameState)
      expect(production.food).toBeCloseTo(0.36)
    })

    it('should keep resource limits unchanged when no resource-limit tech exists', () => {
      gameState.researchedTechIds = ['woodworking', 'crop_rotation']

      const limits = calculateResourceLimits(gameState)
      expect(limits.food).toBe(INITIAL_RESOURCE_LIMITS.food)
      expect(limits.wood).toBe(INITIAL_RESOURCE_LIMITS.wood)
      expect(limits.science).toBe(INITIAL_RESOURCE_LIMITS.science)
    })

    it('should apply researched tech multiplier to job production', () => {
      gameState.researchedTechIds = ['woodworking']
      setDogs(2)
      gameState.dogs[0].currentJobId = 'lumberjack'
      gameState.dogs[0].status = 'working'

      const production = calculateJobProduction(gameState)
      expect(production.wood).toBeCloseTo(0.42)
    })

    it('should include dog experience bonus in job production with cap', () => {
      setDogs(1)
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[0].status = 'working'
      gameState.dogs[0].traitId = 'scientist'
      gameState.dogs[0].experienceByJob.farmer = 200

      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(0.9954, 3)
    })

    it('should produce dogpower when hunter is assigned', () => {
      setDogs(1)
      gameState.dogs[0].currentJobId = 'hunter'
      gameState.dogs[0].status = 'working'

      const production = calculateJobProduction(gameState)
      expect(production.dogpower).toBeCloseTo(0.22)
    })

    it('should produce culture when artist is assigned', () => {
      setDogs(1)
      gameState.buildings.library = 1
      gameState.dogs[0].currentJobId = 'artist'
      gameState.dogs[0].status = 'working'

      const production = calculateJobProduction(gameState)
      expect(production.culture).toBeCloseTo(0.16)
    })

    it('should accumulate culture each tick with artist assigned', () => {
      setDogs(1)
      gameState.buildings.library = 1
      gameState.dogs[0].currentJobId = 'artist'
      gameState.dogs[0].status = 'working'
      gameState.resourceCounts.food = 100

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.culture).toBeGreaterThan(0)
    })
  })

  describe('Policy Effects', () => {
    it('should apply democracy policy multiplier to artist job production', () => {
      setDogs(1)
      gameState.buildings.library = 1
      gameState.dogs[0].currentJobId = 'artist'
      gameState.dogs[0].status = 'working'
      gameState.enactedPolicyIds = ['policy-democracy']

      const production = calculateJobProduction(gameState)
      expect(production.culture).toBeCloseTo(0.16 * 1.35)
    })

    it('should apply authoritarian policy multiplier to farmer and penalty to artist', () => {
      setDogs(2)
      gameState.buildings.library = 1
      gameState.buildings.farm = 1
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[0].status = 'working'
      gameState.dogs[1].currentJobId = 'artist'
      gameState.dogs[1].status = 'working'
      gameState.enactedPolicyIds = ['policy-authoritarian']

      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(0.9 * 1.3)
      expect(production.culture).toBeCloseTo(0.16 * 0.75)
    })

    it('should include enacted policy effects in aggregateEffects', () => {
      gameState.enactedPolicyIds = ['policy-democracy']
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6

      const effects = aggregateEffects(gameState)
      expect(effects.jobProductionMultipliers.artist).toBeCloseTo(1.35)
    })

    it('should apply effects from two policies in different groups simultaneously', () => {
      setDogs(2)
      gameState.buildings.library = 1
      gameState.dogs[0].currentJobId = 'artist'
      gameState.dogs[0].status = 'working'
      gameState.dogs[1].currentJobId = 'scientist'
      gameState.dogs[1].status = 'working'
      gameState.enactedPolicyIds = ['policy-democracy', 'policy-radical']

      const production = calculateJobProduction(gameState)
      expect(production.culture).toBeCloseTo(0.16 * 1.35)
      expect(production.science).toBeCloseTo(0.18 * 1.1 * 1.35)
    })
  })

  describe('Leader Trait Effect', () => {
    function setupLeader(traitId: string) {
      setDogs(2)
      gameState.dogs[0].traitId = traitId
      gameState.leaderDogId = gameState.dogs[0].id
    }

    it('should NOT apply leader trait effect when administration is not researched', () => {
      setupLeader('scientist')
      gameState.dogs[1].currentJobId = 'scientist'
      gameState.dogs[1].status = 'working'
      gameState.dogs[1].traitId = 'agriculturalist'

      const production = calculateJobProduction(gameState)
      expect(production.science).toBeCloseTo(0.18)
    })

    it('should apply leader trait effect once administration is researched', () => {
      setupLeader('scientist')
      gameState.researchedTechIds = ['administration']
      gameState.dogs[1].currentJobId = 'scientist'
      gameState.dogs[1].status = 'working'
      gameState.dogs[1].traitId = 'agriculturalist'

      const production = calculateJobProduction(gameState)
      expect(production.science).toBeCloseTo(0.18 * 1.1)
    })

    it('should only apply the designated leader trait, not other dogs traits', () => {
      setDogs(3)
      gameState.dogs[0].traitId = 'agriculturalist'
      gameState.leaderDogId = gameState.dogs[0].id
      gameState.researchedTechIds = ['administration']

      gameState.dogs[1].traitId = 'scientist'
      gameState.dogs[1].currentJobId = 'scientist'
      gameState.dogs[1].status = 'working'

      gameState.dogs[2].traitId = 'agriculturalist'
      gameState.dogs[2].currentJobId = 'farmer'
      gameState.dogs[2].status = 'working'

      const production = calculateJobProduction(gameState)
      expect(production.food).toBeCloseTo(0.9 * 1.1)
      expect(production.science).toBeCloseTo(0.18)
    })

    it('should clear leader effect after leader dog dies (leaderDogId auto-cleared)', () => {
      setDogs(1)
      gameState.dogs[0].traitId = 'scientist'
      gameState.leaderDogId = gameState.dogs[0].id
      gameState.researchedTechIds = ['administration']

      gameState.dogs = []

      const { gameState: next } = tick(gameState)
      expect(next.leaderDogId).toBeNull()
    })

    it('should have no leader effect when leaderDogId is null even with administration researched', () => {
      setDogs(1)
      gameState.dogs[0].currentJobId = 'scientist'
      gameState.dogs[0].status = 'working'
      gameState.dogs[0].traitId = 'scientist'
      gameState.leaderDogId = null
      gameState.researchedTechIds = ['administration']

      const production = calculateJobProduction(gameState)
      expect(production.science).toBeCloseTo(0.18)
    })
  })

  describe('Tick', () => {
    it('should produce resources on tick', () => {
      gameState.buildings.farm = 1
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
      const { gameState: newState } = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(
        30 + 0.15 - FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
      )
      expect(newState.tickCount).toBe(TICKS_PER_DAY * DAYS_PER_MONTH * 6 + 1)
    })

    it('should not exceed resource limits on tick', () => {
      gameState.buildings.warehouse = 2
      gameState.resourceCounts.food = 19999
      gameState.buildings.farm = 20
      const limits = calculateResourceLimits(gameState)
      const { gameState: newState } = tick(gameState)
      expect(newState.resourceCounts.food).toBeCloseTo(limits.food)
    })

    it('should increase population when domestication is enabled and food is enough', () => {
      gameState.buildings.barn = 5
      gameState.buildings.warehouse = 10
      gameState.resourceCounts.food = 5000
      gameState.isDomesticateEnabled = true

      let next = gameState
      for (let i = 0; i < 200; i += 1) {
        const result = tick(next)
        next = result.gameState
      }

      expect(next.dogs.length).toBeGreaterThan(0)
      expect(next.dogs.length).toBeLessThanOrEqual(next.populationCap)
    })

    it('should apply job production during tick', () => {
      gameState.resourceCounts.food = 50
      setDogs(4)
      gameState.populationCap = 10
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[1].currentJobId = 'farmer'
      gameState.dogs[2].currentJobId = 'lumberjack'
      gameState.dogs[0].status = 'working'
      gameState.dogs[1].status = 'working'
      gameState.dogs[2].status = 'working'
      gameState.dogs[0].traitId = 'scientist'
      gameState.dogs[1].traitId = 'scientist'

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.food).toBeCloseTo(
        50 + 1.8 - 4 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK,
      )
      expect(next.resourceCounts.wood).toBeCloseTo(0.35)
    })

    it('should not increase growth when domestication is enabled but food is not enough for domestication cost', () => {
      setDogs(0)
      gameState.resourceCounts.food = FOOD_CONSUMPTION_PER_PUPPY_PER_TICK - 0.1
      gameState.isDomesticateEnabled = true

      const { gameState: next } = tick(gameState)
      expect(next.populationGrowthProgress).toBe(0)
      expect(next.resourceCounts.food).toBeCloseTo(FOOD_CONSUMPTION_PER_PUPPY_PER_TICK - 0.1)
    })

    it('should keep growth unchanged when domestication is disabled and there is no deficit', () => {
      setDogs(0)
      gameState.resourceCounts.food = 100
      gameState.populationGrowthProgress = 0.4
      gameState.isDomesticateEnabled = false

      const { gameState: next } = tick(gameState)
      expect(next.populationGrowthProgress).toBeCloseTo(0.4)
      expect(next.dogs.length).toBe(0)
    })

    it('should reset positive progress and accumulate starvation when food deficit exists', () => {
      setDogs(5)
      gameState.resourceCounts.food = 0
      gameState.populationGrowthProgress = 0.6

      const { gameState: next } = tick(gameState)
      const expectedStarvationDelta =
        ((5 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK) / FOOD_CONSUMPTION_PER_PUPPY_PER_TICK) *
        POPULATION_GROWTH_RATE

      expect(next.populationGrowthProgress).toBeCloseTo(-expectedStarvationDelta)
      expect(next.resourceCounts.food).toBe(0)
    })

    it('should reduce population after enough starvation progress is accumulated', () => {
      gameState.buildings.barn = 2
      setDogs(5)
      gameState.resourceCounts.food = 0

      let next = gameState
      for (let i = 0; i < 40; i += 1) {
        const result = tick(next)
        next = result.gameState
      }

      expect(next.populationGrowthProgress).toBeLessThan(0)
      expect(next.dogs.length).toBeLessThan(5)
    })

    it('should not spend domestication food when population is at cap', () => {
      gameState.buildings.barn = 1
      setDogs(4)
      gameState.resourceCounts.food = 200
      gameState.populationGrowthProgress = 0.8
      gameState.isDomesticateEnabled = true

      const { gameState: next } = tick(gameState)
      expect(next.dogs.length).toBe(next.populationCap)
      expect(next.resourceCounts.food).toBeCloseTo(200 - 4 * FOOD_CONSUMPTION_PER_PUPPY_PER_TICK)
      expect(next.populationGrowthProgress).toBeCloseTo(0.8)
    })

    it('should rebalance job assignments after starvation deaths', () => {
      gameState.buildings.barn = 2
      setDogs(5)
      gameState.resourceCounts.food = 0
      gameState.dogs[0].currentJobId = 'farmer'
      gameState.dogs[1].currentJobId = 'farmer'
      gameState.dogs[2].currentJobId = 'farmer'
      gameState.dogs[3].currentJobId = 'lumberjack'
      gameState.dogs[4].currentJobId = 'lumberjack'
      gameState.dogs.forEach((dog) => {
        dog.status = dog.currentJobId ? 'working' : 'idle'
      })

      let next = gameState
      for (let i = 0; i < 10; i += 1) {
        const result = tick(next)
        next = result.gameState
      }

      const totalAssigned = next.dogs.filter((dog) => dog.currentJobId !== null).length
      expect(totalAssigned).toBeLessThanOrEqual(next.dogs.length)
    })

    it('should remove the last dog first when starvation causes deaths', () => {
      setDogs(3)
      gameState.resourceCounts.food = 0
      gameState.populationGrowthProgress = -0.95
      const lastDogId = gameState.dogs[2].id

      const result = tick(gameState)
      const isLastDogStillAlive = result.gameState.dogs.some((dog) => dog.id === lastDogId)
      expect(isLastDogStillAlive).toBe(false)
      expect(result.events[0]?.type).toBe('death')
    })

    it('should increase experience for working dogs after tick', () => {
      setDogs(1)
      gameState.resourceCounts.food = 100
      gameState.dogs[0].currentJobId = 'scientist'
      gameState.dogs[0].status = 'working'

      const before = gameState.dogs[0].experienceByJob.scientist
      const { gameState: next } = tick(gameState)
      expect(next.dogs[0].experienceByJob.scientist).toBeGreaterThan(before)
    })
  })

  describe('Calendar', () => {
    it('should start at 387年3月1日 when tickCount is 0', () => {
      gameState.tickCount = 0
      const cal = calculateCalendarProgress(gameState)
      expect(cal.year).toBe(CALENDAR_START_YEAR)
      expect(cal.month).toBe(CALENDAR_START_MONTH)
      expect(cal.day).toBe(CALENDAR_START_DAY)
      expect(cal.season).toBe('spring')
    })

    it('should advance 1 day after TICKS_PER_DAY ticks', () => {
      gameState.tickCount = TICKS_PER_DAY
      const cal = calculateCalendarProgress(gameState)
      expect(cal.day).toBe(2)
      expect(cal.month).toBe(3)
      expect(cal.year).toBe(387)
    })

    it('should roll over to next month after 30 days', () => {
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH
      const cal = calculateCalendarProgress(gameState)
      expect(cal.day).toBe(1)
      expect(cal.month).toBe(4)
      expect(cal.year).toBe(387)
    })

    it('should roll over to next year after 12 months', () => {
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * MONTHS_PER_YEAR
      const cal = calculateCalendarProgress(gameState)
      expect(cal.day).toBe(1)
      expect(cal.month).toBe(3)
      expect(cal.year).toBe(388)
    })

    it('should switch season at correct month boundaries', () => {
      gameState.tickCount = 0
      expect(calculateCalendarProgress(gameState).season).toBe('spring')

      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 3
      expect(calculateCalendarProgress(gameState).season).toBe('summer')

      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
      expect(calculateCalendarProgress(gameState).season).toBe('autumn')

      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 9
      expect(calculateCalendarProgress(gameState).season).toBe('winter')
    })

    it('should return winter for month 12 and 1', () => {
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 9
      expect(calculateCalendarProgress(gameState).month).toBe(12)
      expect(calculateCalendarProgress(gameState).season).toBe('winter')

      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 10
      expect(calculateCalendarProgress(gameState).month).toBe(1)
      expect(calculateCalendarProgress(gameState).season).toBe('winter')
    })
  })

  describe('Season effects on production', () => {
    it('should produce more food in summer than in winter', () => {
      gameState.buildings.farm = 2

      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 3
      const summerProduction = calculateProduction(gameState)

      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 9
      const winterProduction = calculateProduction(gameState)

      expect(summerProduction.food).toBeGreaterThan(winterProduction.food)
    })

    it('should produce base food rate in spring with farm', () => {
      gameState.buildings.farm = 1
      gameState.tickCount = 0
      const springProduction = calculateProduction(gameState)
      expect(springProduction.food).toBeCloseTo(0.1725)
    })
  })

  describe('Toggleable Buildings (Smelter)', () => {
    it('should consume wood and stone and produce iron when smelter is active and resources are sufficient', () => {
      gameState.buildings.smelter = 1
      gameState.buildingActiveCounts.smelter = 1
      gameState.resourceCounts.wood = 10
      gameState.resourceCounts.stone = 10
      gameState.resourceCounts.iron = 0

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.wood).toBeCloseTo(9.2)
      expect(next.resourceCounts.stone).toBeCloseTo(9.2)
      expect(next.resourceCounts.iron).toBeCloseTo(0.55)
    })

    it('should not consume or produce when resources are insufficient', () => {
      gameState.buildings.smelter = 1
      gameState.buildingActiveCounts.smelter = 1
      gameState.resourceCounts.wood = 0
      gameState.resourceCounts.stone = 0
      gameState.resourceCounts.iron = 0

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.wood).toBe(0)
      expect(next.resourceCounts.stone).toBe(0)
      expect(next.resourceCounts.iron).toBe(0)
    })

    it('should not produce when activeCount is 0', () => {
      gameState.buildings.smelter = 1
      gameState.buildingActiveCounts.smelter = 0
      gameState.resourceCounts.wood = 10
      gameState.resourceCounts.stone = 10

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.iron).toBe(0)
    })

    it('should scale linearly with activeCount', () => {
      gameState.buildings.smelter = 3
      gameState.buildingActiveCounts.smelter = 3
      gameState.resourceCounts.wood = 10
      gameState.resourceCounts.stone = 10
      gameState.resourceCounts.iron = 0

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.wood).toBeCloseTo(7.6)
      expect(next.resourceCounts.stone).toBeCloseTo(7.6)
      expect(next.resourceCounts.iron).toBeCloseTo(1.65)
    })

    it('should stop entire batch when only one resource is insufficient', () => {
      gameState.buildings.smelter = 1
      gameState.buildingActiveCounts.smelter = 1
      gameState.resourceCounts.wood = 10
      gameState.resourceCounts.stone = 0
      gameState.resourceCounts.iron = 0

      const { gameState: next } = tick(gameState)
      expect(next.resourceCounts.wood).toBeCloseTo(10)
      expect(next.resourceCounts.iron).toBe(0)
    })
  })
})
