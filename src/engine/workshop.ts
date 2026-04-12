import { WORKSHOP_UNLOCKS, type GameState, type WorkshopUnlock } from '@/engine/types'
import { isRequirementSatisfied } from '@/engine/technologies'

export function getWorkshopUnlockById(unlockId: string): WorkshopUnlock {
  const unlock = WORKSHOP_UNLOCKS.find((item) => item.id === unlockId)
  if (!unlock) {
    throw new Error(`工坊项目 ${unlockId} 不存在`)
  }

  return unlock
}

export function isWorkshopUnlockUnlocked(state: GameState, unlockId: string): boolean {
  return state.workshopUnlockIds.includes(unlockId)
}

export function isWorkshopUnlockVisible(state: GameState, unlock: WorkshopUnlock): boolean {
  if (isWorkshopUnlockUnlocked(state, unlock.id)) {
    return true
  }

  return isRequirementSatisfied(state, unlock.prerequisites || {})
}

export function getVisibleWorkshopUnlockIds(state: GameState): string[] {
  return WORKSHOP_UNLOCKS.filter((unlock) => isWorkshopUnlockVisible(state, unlock)).map((unlock) => unlock.id)
}

export function canUnlockWorkshopItem(state: GameState, unlockId: string): boolean {
  const unlock = getWorkshopUnlockById(unlockId)

  if (isWorkshopUnlockUnlocked(state, unlock.id)) {
    return false
  }

  if (!isRequirementSatisfied(state, unlock.prerequisites || {})) {
    return false
  }

  for (const [resourceId, cost] of Object.entries(unlock.cost)) {
    if ((state.resourceCounts[resourceId] || 0) < cost) {
      return false
    }
  }

  return true
}

export function unlockWorkshopItem(state: GameState, unlockId: string): GameState {
  const unlock = getWorkshopUnlockById(unlockId)

  if (isWorkshopUnlockUnlocked(state, unlock.id)) {
    throw new Error(`工坊项目 ${unlockId} 已经解锁`)
  }

  if (!isRequirementSatisfied(state, unlock.prerequisites || {})) {
    throw new Error(`工坊项目 ${unlockId} 前置条件未满足`)
  }

  const nextResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, cost] of Object.entries(unlock.cost)) {
    if ((nextResourceCounts[resourceId] || 0) < cost) {
      throw new Error(`解锁工坊项目 ${unlockId} 所需资源 ${resourceId} 不足（需要 ${cost}，当前 ${nextResourceCounts[resourceId] || 0}）`)
    }
  }

  for (const [resourceId, cost] of Object.entries(unlock.cost)) {
    nextResourceCounts[resourceId] -= cost
  }

  return {
    ...state,
    resourceCounts: nextResourceCounts,
    workshopUnlockIds: [...state.workshopUnlockIds, unlock.id],
  }
}
