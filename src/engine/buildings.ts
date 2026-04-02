import { BUILDINGS, type Building, type GameState } from '@/engine/types'

function roundBuildingCost(amount: number): number {
  return Math.ceil(amount)
}

export function getBuildingDefinition(buildingId: string): Building {
  const building = BUILDINGS.find((item) => item.id === buildingId)
  if (!building) {
    throw new Error(`建筑 ${buildingId} 不存在`)
  }

  return building
}

export function getBuildingCost(state: GameState, buildingId: string): Record<string, number> {
  const building = getBuildingDefinition(buildingId)
  const ownedCount = state.buildings[building.id] || 0
  const growthFactor = building.costGrowthMultiplier ** ownedCount

  const cost: Record<string, number> = {}
  for (const [resourceId, baseCost] of Object.entries(building.cost)) {
    cost[resourceId] = roundBuildingCost(baseCost * growthFactor)
  }

  return cost
}

export function canBuildBuilding(state: GameState, buildingId: string): boolean {
  const buildingCost = getBuildingCost(state, buildingId)

  for (const [resourceId, costAmount] of Object.entries(buildingCost)) {
    if ((state.resourceCounts[resourceId] || 0) < costAmount) {
      return false
    }
  }

  return true
}

export function buildBuilding(state: GameState, buildingId: string): GameState {
  const building = getBuildingDefinition(buildingId)
  const buildingCost = getBuildingCost(state, buildingId)

  for (const [resourceId, costAmount] of Object.entries(buildingCost)) {
    if ((state.resourceCounts[resourceId] || 0) < costAmount) {
      throw new Error(`资源 ${resourceId} 不足`)
    }
  }

  const newResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, costAmount] of Object.entries(buildingCost)) {
    newResourceCounts[resourceId] -= costAmount
  }

  const newBuildings: Record<string, number> = { ...state.buildings }
  newBuildings[building.id] = (newBuildings[building.id] || 0) + 1

  return {
    ...state,
    resourceCounts: newResourceCounts,
    buildings: newBuildings,
  }
}