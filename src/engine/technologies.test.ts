import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialGameState, type GameState } from '@/engine/types'
import {
  aggregateTechEffects,
  canResearchTechnology,
  getVisibleTechnologies,
  isRequirementSatisfied,
  researchTechnology,
} from '@/engine/technologies'
import { getBuildingDefinition, getBuildingCost } from '@/engine/buildings'

describe('Technologies', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = createInitialGameState()
  })

  it('should hide technologies whose prerequisites are not met', () => {
    const visible = getVisibleTechnologies(gameState)
    expect(visible.map((tech) => tech.id)).toEqual(['woodworking'])
  })

  it('should require enough resources to research visible technology', () => {
    expect(canResearchTechnology(gameState, 'woodworking')).toBe(false)

    gameState.resourceCounts.science = 30
    expect(canResearchTechnology(gameState, 'woodworking')).toBe(true)
  })

  it('should block research when prerequisites are unmet', () => {
    gameState.resourceCounts.science = 999
    expect(() => researchTechnology(gameState, 'crop_rotation')).toThrow('前置条件未满足')
  })

  it('should deduct cost and append researched technology once', () => {
    gameState.resourceCounts.science = 30

    const researched = researchTechnology(gameState, 'woodworking')
    expect(researched.resourceCounts.science).toBe(0)
    expect(researched.researchedTechIds).toEqual(['woodworking'])

    const second = researchTechnology(researched, 'woodworking')
    expect(second).toBe(researched)
  })

  it('should satisfy unlock requirements by researched technologies and buildings', () => {
    const scientistJob = { requiredTechs: ['scientific_method'], requiredBuildings: ['library'] }

    expect(isRequirementSatisfied(gameState, scientistJob)).toBe(false)

    gameState.researchedTechIds = ['scientific_method']
    expect(isRequirementSatisfied(gameState, scientistJob)).toBe(false)

    gameState.buildings.library = 1
    expect(isRequirementSatisfied(gameState, scientistJob)).toBe(true)
  })

  it('should aggregate all v1 effect types', () => {
    gameState.researchedTechIds = ['woodworking', 'crop_rotation', 'scientific_method']

    const aggregated = aggregateTechEffects(gameState)
    expect(aggregated.buildingCostMultipliers.farm).toBeCloseTo(0.9)
    expect(aggregated.buildingProductionMultipliers.farm).toBeCloseTo(1.25)
    expect(aggregated.jobProductionMultipliers.lumberjack).toBeCloseTo(1.2)
    expect(aggregated.resourceLimitBonuses.science).toBe(250)
  })

  it('should apply technology discount to building cost calculation', () => {
    gameState.researchedTechIds = ['woodworking', 'crop_rotation']
    const farm = getBuildingDefinition('farm')

    const discountedCost = getBuildingCost(gameState, 'farm')
    expect(discountedCost.food).toBe(Math.ceil((farm.cost.food || 0) * 0.9))
  })
})
