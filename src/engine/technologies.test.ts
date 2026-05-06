import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TECHNOLOGIES, WORKSHOP_UNLOCKS, SEASON_EFFECTS, type GameState, type Technology } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  aggregateEffects,
  canResearchTechnology,
  getVisibleJobsIds,
  getVisibleTechnologiesIds,
  getUnlockedBuildingsIds,
  getTechnologyById,
  getUnlockedJobsIds,
  isJobVisible,
  isRequirementSatisfied,
  isTechnologyVisible,
  isTechResearched,
  researchTechnology,
} from '@/engine/technologies'
import { getBuildingById, getBuildingCost } from '@/engine/buildings'
import { BUILDINGS, JOBS } from '@/engine/types'
import { TICKS_PER_DAY, DAYS_PER_MONTH } from '@/engine/constants'

describe('Technologies', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  it('should hide technologies whose prerequisites are not met', () => {
    const visibleIds = getVisibleTechnologiesIds(gameState)
    expect(visibleIds).toEqual([])
  })

  it('should require enough resources to research visible technology', () => {
    expect(canResearchTechnology(gameState, 'woodworking')).toBe(false)

    gameState.buildings.library = 1
    gameState.resourceCounts.science = 600
    gameState.resourceCounts.wood = 200
    expect(canResearchTechnology(gameState, 'woodworking')).toBe(true)

    gameState.researchedTechIds = ['woodworking']
    expect(canResearchTechnology(gameState, 'woodworking')).toBe(false)
  })

  it('should block research when resources are insufficient', () => {
    gameState.buildings.library = 1
    gameState.resourceCounts.science = 600
    gameState.resourceCounts.wood = 199
    expect(() => researchTechnology(gameState, 'woodworking')).toThrow('所需资源 wood 不足')
  })

  it('should deduct cost and append researched technology once', () => {
    gameState.buildings.library = 1
    gameState.resourceCounts.science = 600
    gameState.resourceCounts.wood = 200

    const researched = researchTechnology(gameState, 'woodworking')
    expect(researched.resourceCounts.science).toBe(0)
    expect(researched.resourceCounts.wood).toBe(0)
    expect(researched.researchedTechIds).toEqual(['woodworking'])

    expect(() => researchTechnology(researched, 'woodworking')).toThrow('已经被研究过了')
  })

  it('should satisfy unlock requirements by researched technologies and buildings', () => {
    const scientistJob = { requiredBuildings: ['library'] }

    expect(isRequirementSatisfied(gameState, scientistJob)).toBe(false)

    gameState.buildings.library = 1
    expect(isRequirementSatisfied(gameState, scientistJob)).toBe(true)

    const requirement = { requiredTechs: ['woodworking'] }
    expect(isRequirementSatisfied(gameState, requirement)).toBe(false)

    gameState.researchedTechIds = ['woodworking']
    expect(isRequirementSatisfied(gameState, requirement)).toBe(true)
  })

  it('should satisfy workshop unlock requirements for jobs', () => {
    const minerJob = { requiredWorkshopUnlockIds: ['wood_pickaxe'] }

    expect(isRequirementSatisfied(gameState, minerJob)).toBe(false)

    gameState.workshopUnlockIds = ['wood_pickaxe']
    expect(isRequirementSatisfied(gameState, minerJob)).toBe(true)
  })

  it('should only show jobs whose prerequisites are satisfied', () => {
    expect(getVisibleJobsIds(gameState)).toEqual(['lumberjack'])

    gameState.buildings.farm = 1
    expect(getVisibleJobsIds(gameState)).toContain('farmer')

    gameState.workshopUnlockIds = ['wood_pickaxe']
    expect(getVisibleJobsIds(gameState)).toContain('miner')
  })

  it('should aggregate additive and multiplier effect modes', () => {
    const stackingTech: Technology = {
      id: 'stacking_test_tech',
      name: 'stacking test',
      description: 'temporary test technology',
      cost: {},
      effects: [
        {
          id: 'stacking-test-additive',
          type: 'job_production',
          targetId: 'lumberjack',
          value: 0.1,
          mode: 'additive',
        },
        {
          id: 'stacking-test-multiplier',
          type: 'job_production',
          targetId: 'lumberjack',
          value: 1.2,
          mode: 'multiplier',
        },
      ],
    }

    TECHNOLOGIES.push(stackingTech)

    try {
      gameState.researchedTechIds = ['woodworking', 'crop_rotation', stackingTech.id]
      gameState.buildings.library = 2
      gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
      const aggregated = aggregateEffects(gameState)
      expect(aggregated.buildingCostMultipliers.farm).toBeCloseTo(0.8)
      expect(aggregated.buildingProductionMultipliers.farm).toBeCloseTo(1.2)
      expect(aggregated.jobProductionMultipliers.lumberjack).toBeCloseTo(1.584)
      expect(aggregated.jobProductionMultipliers.scientist).toBeCloseTo(1.2)
    } finally {
      const index = TECHNOLOGIES.findIndex(t => t.id === 'stacking_test_tech')
      if (index !== -1) TECHNOLOGIES.splice(index, 1)
    }
  })

  it('should apply technology discount to building cost calculation', () => {
    gameState.researchedTechIds = ['woodworking', 'crop_rotation']
    const farm = getBuildingById('farm')

    const discountedCost = getBuildingCost(gameState, 'farm')
    expect(discountedCost.food).toBe(Math.ceil((farm.cost.food || 0) * 0.8))
  })

  it('should return technology if it exists', () => {
    expect(() => getTechnologyById('test')).toThrow('科技 test 不存在')
  })

  it('should return technology if it is visible', () => {
    const tech = getTechnologyById('woodworking')
    expect(isTechnologyVisible(gameState, tech)).toBe(false)

    gameState.researchedTechIds = ['woodworking']
    expect(isTechnologyVisible(gameState, tech)).toBe(true)
  })

  it('should return unlocked building ids', () => {
    const ids = getUnlockedBuildingsIds(gameState)
    expect(ids.every((id: string) => BUILDINGS.some((building) => building.id === id))).toBe(true)
  })

  it('should return unlocked job ids', () => {
    const ids = getUnlockedJobsIds(gameState)
    expect(ids.every((id: string) => JOBS.some((job) => job.id === id))).toBe(true)
  })

  it('should throw when job does not exist', () => {
    expect(() => isJobVisible(gameState, 'test')).toThrow('职业 test 不存在')
  })

  it('should return false when job prerequisites are not satisfied', () => {
    expect(isJobVisible(gameState, 'scientist')).toBe(false)
  })

  it('should return true when job prerequisites are satisfied', () => {
    gameState.buildings.library = 1
    expect(isJobVisible(gameState, 'scientist')).toBe(true)
  })

  it('returns false when any required resource is not enough', () => {
    gameState.buildings.library = 1
    gameState.resourceCounts.science = 600
    gameState.resourceCounts.wood = 199

    expect(canResearchTechnology(gameState, 'woodworking')).toBe(false)
  })

  it('should return true for isTechResearched when tech is in list', () => {
    gameState.researchedTechIds = ['woodworking']
    expect(isTechResearched(gameState, 'woodworking')).toBe(true)
    expect(isTechResearched(gameState, 'crop_rotation')).toBe(false)
  })

  it('should handle requirement with empty prerequisites', () => {
    expect(isRequirementSatisfied(gameState, {})).toBe(true)
  })

  it('should handle requirement with all three prerequisite types', () => {
    const requirement = {
      requiredTechs: ['woodworking'],
      requiredBuildings: ['library'],
      requiredWorkshopUnlockIds: ['wood_pickaxe'],
    }

    expect(isRequirementSatisfied(gameState, requirement)).toBe(false)

    gameState.researchedTechIds = ['woodworking']
    gameState.buildings.library = 1
    gameState.workshopUnlockIds = ['wood_pickaxe']

    expect(isRequirementSatisfied(gameState, requirement)).toBe(true)
  })

  it('should return false when technology prerequisites not satisfied', () => {
    gameState.buildings.library = 0
    gameState.resourceCounts.science = 1000
    gameState.resourceCounts.wood = 1000

    expect(canResearchTechnology(gameState, 'woodworking')).toBe(false)
  })

  it('should return false when any resource is missing', () => {
    gameState.buildings.library = 1
    gameState.resourceCounts.science = 0
    gameState.resourceCounts.wood = 1000

    expect(canResearchTechnology(gameState, 'woodworking')).toBe(false)
  })

  it('should return true for researched technologies even if other requirements not met', () => {
    gameState.researchedTechIds = ['woodworking']
    gameState.buildings.library = 0

    const tech = getTechnologyById('woodworking')
    expect(isTechnologyVisible(gameState, tech)).toBe(true)
  })

  it('should throw error when prerequisites not met for research', () => {
    gameState.buildings.library = 0
    gameState.resourceCounts.science = 1000
    gameState.resourceCounts.wood = 1000

    expect(() => researchTechnology(gameState, 'woodworking')).toThrow(/前置条件未满足/)
  })

  it('should not apply building effects when count is zero', () => {
    gameState.buildings.library = 0

    const result = aggregateEffects(gameState)
    expect(result.jobProductionMultipliers.scientist || 1).toBe(1)
  })

  it('should handle unknown tech effect types gracefully', () => {
    const unknownEffectTech: Technology = {
      id: 'unknown_effect_tech',
      name: 'Unknown Effect Test',
      description: 'Tests unknown effect handling',
      cost: {},
      effects: [
        {
          id: 'unknown',
          type: 'unknown_type' as any,
          targetId: 'lumberjack',
          value: 1.0,
          mode: 'additive',
        },
      ],
    }

    TECHNOLOGIES.push(unknownEffectTech)

    try {
      gameState.researchedTechIds = [unknownEffectTech.id]
      const result = aggregateEffects(gameState)
      expect(result).toBeDefined()
    } finally {
      const index = TECHNOLOGIES.findIndex(t => t.id === 'unknown_effect_tech')
      if (index !== -1) TECHNOLOGIES.splice(index, 1)
    }
  })

  it('should finalize effects correctly with only additive bonuses', () => {
    const additiveTech: Technology = {
      id: 'additive_only',
      name: 'Additive Only',
      description: 'Test',
      cost: {},
      effects: [
        {
          id: 'add1',
          type: 'job_production',
          targetId: 'lumberjack',
          value: 0.2,
          mode: 'additive',
        },
        {
          id: 'add2',
          type: 'job_production',
          targetId: 'lumberjack',
          value: 0.3,
          mode: 'additive',
        },
      ],
    }

    TECHNOLOGIES.push(additiveTech)

    try {
      gameState.researchedTechIds = [additiveTech.id]
      const result = aggregateEffects(gameState)
      expect(result.jobProductionMultipliers.lumberjack).toBeCloseTo(1.5)
    } finally {
      const index = TECHNOLOGIES.findIndex(t => t.id === 'additive_only')
      if (index !== -1) TECHNOLOGIES.splice(index, 1)
    }
  })

  it('should finalize effects correctly with only multiplier bonuses', () => {
    const multiplierTech: Technology = {
      id: 'multiplier_only',
      name: 'Multiplier Only',
      description: 'Test',
      cost: {},
      effects: [
        {
          id: 'mult1',
          type: 'job_production',
          targetId: 'lumberjack',
          value: 1.2,
          mode: 'multiplier',
        },
        {
          id: 'mult2',
          type: 'job_production',
          targetId: 'lumberjack',
          value: 1.3,
          mode: 'multiplier',
        },
      ],
    }

    TECHNOLOGIES.push(multiplierTech)

    try {
      gameState.researchedTechIds = [multiplierTech.id]
      const result = aggregateEffects(gameState)
      expect(result.jobProductionMultipliers.lumberjack).toBeCloseTo(1.56)
    } finally {
      const index = TECHNOLOGIES.findIndex(t => t.id === 'multiplier_only')
      if (index !== -1) TECHNOLOGIES.splice(index, 1)
    }
  })

  it('should apply building production effects when building count is positive', () => {
    gameState.buildings.library = 2
    gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
    const result = aggregateEffects(gameState)
    expect(result.jobProductionMultipliers.scientist).toBeGreaterThan(1)
  })

  it('should apply season effects on building production in spring vs autumn', () => {
    gameState.buildings.farm = 1
    gameState.tickCount = 0
    const springResult = aggregateEffects(gameState)

    gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
    const autumnResult = aggregateEffects(gameState)

    expect(springResult.buildingProductionMultipliers.farm).toBeGreaterThan(
      autumnResult.buildingProductionMultipliers.farm || 1
    )
  })

  it('should apply season effects on building production in winter vs autumn', () => {
    gameState.buildings.farm = 1
    gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 9
    const winterResult = aggregateEffects(gameState)

    gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
    const autumnResult = aggregateEffects(gameState)

    const winterFarm = winterResult.buildingProductionMultipliers.farm || 1
    const autumnFarm = autumnResult.buildingProductionMultipliers.farm || 1
    expect(winterFarm).toBeLessThanOrEqual(autumnFarm)
  })

  it('should apply workshop unlock effects in aggregateEffects', () => {
    gameState.workshopUnlockIds = ['wood_pickaxe']
    gameState.tickCount = TICKS_PER_DAY * DAYS_PER_MONTH * 6
    const result = aggregateEffects(gameState)
    expect(result).toBeDefined()
  })

  it('should apply workshop unlock with unknown effect type gracefully', () => {
    const fakeUnlock = {
      id: 'fake_unlock_test',
      name: 'Fake Unlock',
      effects: [
        {
          id: 'fake-eff',
          type: 'unknown_type' as any,
          targetId: 'farm',
          value: 1.0,
          mode: 'additive' as any,
        },
      ],
    }

    WORKSHOP_UNLOCKS.push(fakeUnlock as any)

    try {
      gameState.workshopUnlockIds = ['fake_unlock_test']
      const result = aggregateEffects(gameState)
      expect(result).toBeDefined()
    } finally {
      const index = WORKSHOP_UNLOCKS.findIndex(u => u.id === 'fake_unlock_test')
      if (index !== -1) WORKSHOP_UNLOCKS.splice(index, 1)
    }
  })

  describe('Technologies - Line Coverage', () => {
    let gameState: GameState

    beforeEach(() => {
      gameState = createInitialGameState()
      gameState.buildings.library = 1
      gameState.buildings.farm = 1
      gameState.resourceCounts.science = 10000
      gameState.resourceCounts.wood = 10000
      gameState.resourceCounts.food = 10000
      gameState.resourceCounts.stone = 10000
    })

    it('addEffectContribution with targetId null should return early', () => {
      const techWithNullTarget: Technology = {
        id: 'null_target_tech',
        name: 'Null Target',
        description: 'Test tech with null target',
        cost: { science: 100 },
        prerequisites: { requiredBuildings: ['library'] },
        effects: [
          {
            id: 'null_effect',
            type: 'building_cost',
            targetId: null as any,
            value: 0.5,
            mode: 'multiplier',
          },
        ],
      }

      TECHNOLOGIES.push(techWithNullTarget)

      try {
        gameState.researchedTechIds = []
        gameState.resourceCounts.science = 100
        const researched = researchTechnology(gameState, techWithNullTarget.id)
        const result = aggregateEffects(researched)
        expect(result).toBeDefined()
      } finally {
        const index = TECHNOLOGIES.findIndex(t => t.id === 'null_target_tech')
        if (index !== -1) TECHNOLOGIES.splice(index, 1)
      }
    })

    it('building_cost effect with additive mode from technology', () => {
      const additiveCostTech: Technology = {
        id: 'additive_cost_tech',
        name: 'Additive Cost',
        description: 'Test additive cost reduction',
        cost: { science: 100 },
        prerequisites: { requiredBuildings: ['library'] },
        effects: [
          {
            id: 'add_cost',
            type: 'building_cost',
            targetId: 'farm',
            value: -0.2,
            mode: 'additive',
          },
        ],
      }

      TECHNOLOGIES.push(additiveCostTech)

      try {
        gameState.researchedTechIds = [additiveCostTech.id]
        const result = aggregateEffects(gameState)
        expect(result.buildingCostMultipliers.farm).toBeCloseTo(0.8)
      } finally {
        const index = TECHNOLOGIES.findIndex(t => t.id === 'additive_cost_tech')
        if (index !== -1) TECHNOLOGIES.splice(index, 1)
      }
    })

    it('building_production effect with additive mode from workshop unlock', () => {
      const additiveProductionUnlock = {
        id: 'additive_prod_unlock',
        name: 'Additive Production',
        effects: [
          {
            id: 'add_prod',
            type: 'building_production',
            targetId: 'farm',
            value: 0.3,
            mode: 'additive',
          },
        ],
      }

      WORKSHOP_UNLOCKS.push(additiveProductionUnlock as any)

      try {
        gameState.workshopUnlockIds = ['additive_prod_unlock']
        gameState.buildings.farm = 1
        gameState.tickCount = TICKS_PER_DAY * 3
        const beforeResult = aggregateEffects(gameState)
        const beforeValue = beforeResult.buildingProductionMultipliers.farm || 1
        
        gameState.workshopUnlockIds = []
        const afterResult = aggregateEffects(gameState)
        const afterValue = afterResult.buildingProductionMultipliers.farm || 1
        
        expect(beforeValue).toBeGreaterThan(afterValue)
      } finally {
        const index = WORKSHOP_UNLOCKS.findIndex(u => u.id === 'additive_prod_unlock')
        if (index !== -1) WORKSHOP_UNLOCKS.splice(index, 1)
      }
    })

    it('building_production effect with multiplier mode from building effects', () => {
      const farmBuilding = BUILDINGS.find(b => b.id === 'farm')
      const originalEffects = farmBuilding?.Effects

      if (farmBuilding) {
        farmBuilding.Effects = [
          {
            id: 'farm_mult',
            type: 'building_production',
            targetId: 'farm',
            value: 2.0,
            mode: 'multiplier',
          },
        ]
      }

      try {
        gameState.buildings.farm = 1
        gameState.tickCount = TICKS_PER_DAY * 3
        const result = aggregateEffects(gameState)
        expect(result.buildingProductionMultipliers.farm).toBeGreaterThan(1)
      } finally {
        if (farmBuilding && originalEffects) {
          farmBuilding.Effects = originalEffects
        }
      }
    })

    it('unknown effect type from technology should console.warn', () => {
      const unknownTypeTech: Technology = {
        id: 'unknown_type_tech',
        name: 'Unknown Type',
        description: 'Test unknown effect type',
        cost: { science: 100 },
        prerequisites: { requiredBuildings: ['library'] },
        effects: [
          {
            id: 'unknown',
            type: 'invalid_type' as any,
            targetId: 'farm',
            value: 1.5,
            mode: 'multiplier',
          },
        ],
      }

      TECHNOLOGIES.push(unknownTypeTech)

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        gameState.researchedTechIds = [unknownTypeTech.id]
        const result = aggregateEffects(gameState)
        expect(result).toBeDefined()
        expect(consoleWarnSpy).toHaveBeenCalled()
      } finally {
        const index = TECHNOLOGIES.findIndex(t => t.id === 'unknown_type_tech')
        if (index !== -1) TECHNOLOGIES.splice(index, 1)
        consoleWarnSpy.mockRestore()
      }
    })

    it('building_cost effect with unknown target from workshop unlock', () => {
      const unknownTargetUnlock = {
        id: 'unknown_target_unlock',
        name: 'Unknown Target',
        effects: [
          {
            id: 'unknown_target',
            type: 'building_cost',
            targetId: 'nonexistent_building',
            value: 0.5,
            mode: 'multiplier',
          },
        ],
      }

      WORKSHOP_UNLOCKS.push(unknownTargetUnlock as any)

      try {
        gameState.workshopUnlockIds = ['unknown_target_unlock']
        const result = aggregateEffects(gameState)
        expect(result.buildingCostMultipliers.nonexistent_building).toBe(0.5)
      } finally {
        const index = WORKSHOP_UNLOCKS.findIndex(u => u.id === 'unknown_target_unlock')
        if (index !== -1) WORKSHOP_UNLOCKS.splice(index, 1)
      }
    })

    it('job_production effect with unknown target from season effects', () => {
      const originalSeasonEffects = { ...SEASON_EFFECTS }
      
      SEASON_EFFECTS.spring = [
        {
          id: 'spring_job',
          type: 'job_production',
          targetId: 'nonexistent_job',
          value: 1.5,
          mode: 'multiplier',
        },
      ]

      try {
        gameState.tickCount = 0
        const result = aggregateEffects(gameState)
        expect(result.jobProductionMultipliers.nonexistent_job).toBe(1.5)
      } finally {
        SEASON_EFFECTS.spring = originalSeasonEffects.spring
      }
    })

    it('building_production effect with unknown target from technology', () => {
      const unknownBuildingTech: Technology = {
        id: 'unknown_building_tech',
        name: 'Unknown Building',
        description: 'Test unknown building target',
        cost: { science: 100 },
        prerequisites: { requiredBuildings: ['library'] },
        effects: [
          {
            id: 'unknown_building',
            type: 'building_production',
            targetId: 'fake_building',
            value: 2.0,
            mode: 'multiplier',
          },
        ],
      }

      TECHNOLOGIES.push(unknownBuildingTech)

      try {
        gameState.researchedTechIds = [unknownBuildingTech.id]
        gameState.tickCount = TICKS_PER_DAY * 3
        const result = aggregateEffects(gameState)
        expect(result.buildingProductionMultipliers.fake_building).toBe(2.0)
      } finally {
        const index = TECHNOLOGIES.findIndex(t => t.id === 'unknown_building_tech')
        if (index !== -1) TECHNOLOGIES.splice(index, 1)
      }
    })

    it('addEffectContribution with additive mode', () => {
      const additiveTech: Technology = {
        id: 'additive_test_tech',
        name: 'Additive Test',
        description: 'Test additive effect',
        cost: { science: 100 },
        prerequisites: { requiredBuildings: ['library'] },
        effects: [
          {
            id: 'add_test',
            type: 'job_production',
            targetId: 'lumberjack',
            value: 0.1,
            mode: 'additive',
          },
        ],
      }

      TECHNOLOGIES.push(additiveTech)

      try {
        gameState.researchedTechIds = [additiveTech.id]
        const result = aggregateEffects(gameState)
        expect(result.jobProductionMultipliers.lumberjack).toBeCloseTo(1.1)
      } finally {
        const index = TECHNOLOGIES.findIndex(t => t.id === 'additive_test_tech')
        if (index !== -1) TECHNOLOGIES.splice(index, 1)
      }
    })

    it('addEffectContribution with multiplier mode', () => {
      const multiplierTech: Technology = {
        id: 'multiplier_test_tech',
        name: 'Multiplier Test',
        description: 'Test multiplier effect',
        cost: { science: 100 },
        prerequisites: { requiredBuildings: ['library'] },
        effects: [
          {
            id: 'mult_test',
            type: 'job_production',
            targetId: 'lumberjack',
            value: 1.2,
            mode: 'multiplier',
          },
        ],
      }

      TECHNOLOGIES.push(multiplierTech)

      try {
        gameState.researchedTechIds = [multiplierTech.id]
        const result = aggregateEffects(gameState)
        expect(result.jobProductionMultipliers.lumberjack).toBeCloseTo(1.2)
      } finally {
        const index = TECHNOLOGIES.findIndex(t => t.id === 'multiplier_test_tech')
        if (index !== -1) TECHNOLOGIES.splice(index, 1)
      }
    })
  })
})