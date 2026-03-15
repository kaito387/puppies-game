import { type GameState, BUILDINGS } from './types'
import { min } from './utils'

export function clickResource(state: GameState, resourceId: string, amount: number = 1): GameState {
  const newResourceCounts = { ...state.resourceCounts }
  newResourceCounts[resourceId] = min(
    (newResourceCounts[resourceId] || 0) + amount,
    state.resourceLimits[resourceId] || 0,
  ) // TODO 考虑资源上限

  return {
    ...state,
    resourceCounts: newResourceCounts,
  }
}

export function buildBuilding(state: GameState, buildingId: string): GameState {
  const building = BUILDINGS.find((b) => b.id === buildingId)
  if (!building) {
    throw new Error(`建筑 ${buildingId} 不存在`)
  }

  for (const [resourceId, costAmount] of Object.entries(building.cost)) {
    if ((state.resourceCounts[resourceId] || 0) < costAmount) {
      throw new Error(`资源 ${resourceId} 不足`)
      // TODO 在资源不足的时候 UI 上禁止调用 buildBuilding 函数，而不是抛出错误
    }
  }

  const newResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, costAmount] of Object.entries(building.cost)) {
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
