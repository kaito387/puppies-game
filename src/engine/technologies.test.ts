import { beforeEach, describe, expect, it } from 'vitest'
import { type GameState } from '@/engine/types'
import { createInitialGameState } from '@/engine/initialState'
import {
  aggregateTechEffects,
  canResearchTechnology,
  getVisibleJobsIds,
  getVisibleTechnologiesIds,
  isRequirementSatisfied,
  researchTechnology,
} from '@/engine/technologies'
import { getBuildingById, getBuildingCost } from '@/engine/buildings'

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

  it('should aggregate all v1 effect types', () => {
    gameState.researchedTechIds = ['woodworking', 'crop_rotation']

    const aggregated = aggregateTechEffects(gameState)
    expect(aggregated.buildingCostMultipliers.farm).toBeCloseTo(0.8)
    expect(aggregated.buildingProductionMultipliers.farm).toBeCloseTo(1.2)
    expect(aggregated.jobProductionMultipliers.lumberjack).toBeCloseTo(1.2)
    expect(aggregated.resourceLimitBonuses).toEqual({})
  })

  it('should apply technology discount to building cost calculation', () => {
    gameState.researchedTechIds = ['woodworking', 'crop_rotation']
    const farm = getBuildingById('farm')

    const discountedCost = getBuildingCost(gameState, 'farm')
    expect(discountedCost.food).toBe(Math.ceil((farm.cost.food || 0) * 0.8))
  })
})
