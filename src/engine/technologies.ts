import {
  BUILDINGS,
  JOBS,
  TECHNOLOGIES,
  WORKSHOP_UNLOCKS,
  type RequirementCarrier,
  type Effect,
  type GameState,
  type Technology,
} from '@/engine/types'

export interface AggregatedTechEffects {
  buildingCostMultipliers: Record<string, number>
  buildingProductionMultipliers: Record<string, number>
  jobProductionMultipliers: Record<string, number>
  resourceLimitBonuses: Record<string, number>
}

export function getTechnologyById(techId: string): Technology {
  const technology = TECHNOLOGIES.find((item) => item.id === techId)
  if (!technology) {
    throw new Error(`科技 ${techId} 不存在`)
  }

  return technology
}

export function isTechResearched(state: GameState, techId: string): boolean {
  return state.researchedTechIds.includes(techId)
}

function hasRequiredTechs(state: GameState, requiredTechs: string[]): boolean {
  return requiredTechs.every((techId) => state.researchedTechIds.includes(techId))
}

function hasRequiredBuildings(state: GameState, requiredBuildings: string[]): boolean {
  return requiredBuildings.every((buildingId) => (state.buildings[buildingId] || 0) > 0)
}

function hasRequiredWorkshopUnlocks(state: GameState, requiredWorkshopUnlockIds: string[]): boolean {
  return requiredWorkshopUnlockIds.every((unlockId) => state.workshopUnlockIds.includes(unlockId))
}

export function isRequirementSatisfied(state: GameState, requirement: RequirementCarrier): boolean {
  if (requirement.requiredTechs && !hasRequiredTechs(state, requirement.requiredTechs)) {
    return false
  }

  if (requirement.requiredBuildings && !hasRequiredBuildings(state, requirement.requiredBuildings)) {
    return false
  }

  if (
    requirement.requiredWorkshopUnlockIds &&
    !hasRequiredWorkshopUnlocks(state, requirement.requiredWorkshopUnlockIds)
  ) {
    return false
  }

  return true
}

export function isTechnologyVisible(state: GameState, technology: Technology): boolean {
  if (isTechResearched(state, technology.id)) {
    return true
  }

  return isRequirementSatisfied(state, technology.prerequisites || {})
}

export function canResearchTechnology(state: GameState, techId: string): boolean {
  const technology = getTechnologyById(techId)

  if (isTechResearched(state, technology.id)) {
    return false
  }

  if (!isRequirementSatisfied(state, technology.prerequisites || {})) {
    return false
  }

  for (const [resourceId, cost] of Object.entries(technology.cost)) {
    if ((state.resourceCounts[resourceId] || 0) < cost) {
      return false
    }
  }

  return true
}

export function getVisibleTechnologiesIds(state: GameState): string[] {
  return TECHNOLOGIES.filter((technology) => isTechnologyVisible(state, technology)).map((tech) => tech.id)
}

function applyMultiplierEffect(
  source: Record<string, number>,
  targetId: string | undefined,
  value: number,
): void {
  if (!targetId) {
    return
  }

  source[targetId] = (source[targetId] || 1) * value
}

export function aggregateTechEffects(state: GameState): AggregatedTechEffects {
  const aggregated: AggregatedTechEffects = {
    buildingCostMultipliers: {},
    buildingProductionMultipliers: {},
    jobProductionMultipliers: {},
    resourceLimitBonuses: {},
  }

  const allEffects: Effect[] = []

  for (const techId of state.researchedTechIds) {
    const technology = getTechnologyById(techId)
    if (technology.effects) {
      allEffects.push(...technology.effects)
    }
  }

  for (const unlockId of state.workshopUnlockIds) {
    const unlock = WORKSHOP_UNLOCKS.find((item) => item.id === unlockId)
    if (unlock?.effects) {
      allEffects.push(...unlock.effects)
    }
  }

  for (const effect of allEffects) {
      switch (effect.type) {
        case 'building_cost': {
          applyMultiplierEffect(
            aggregated.buildingCostMultipliers,
            effect.targetId,
            effect.value,
          )
          break
        }
        case 'building_production': {
          applyMultiplierEffect(
            aggregated.buildingProductionMultipliers,
            effect.targetId,
            effect.value,
          )
          break
        }
        case 'job_production': {
          applyMultiplierEffect(
            aggregated.jobProductionMultipliers,
            effect.targetId,
            effect.value,
          )
          break
        }
        case 'resource_limit': {
          throw new Error('Not implemented yet: resource_limit effect type aggregation')
        }
        default: {
          if (import.meta.env.DEV) {
            console.warn(`未知科技效果类型: ${(effect as Effect).type}`)
          }
        }
      }
  }

for (const building of BUILDINGS) {
  const count = state.buildings[building.id] || 0
  if (count <= 0 || !building.Effects) continue

    for (const effect of building.Effects) {
      if (effect.mode !== 'additive' || !effect.targetId) continue
      if (!aggregated.jobProductionMultipliers[effect.targetId]) {
        aggregated.jobProductionMultipliers[effect.targetId] = 1
      }
      aggregated.jobProductionMultipliers[effect.targetId] += effect.value * count
    }
  }

  return aggregated
}

export function researchTechnology(state: GameState, techId: string): GameState {
  const technology = getTechnologyById(techId)

  if (isTechResearched(state, technology.id)) {
    throw new Error(`科技 ${techId} 已经被研究过了`)
  }

  if (!isRequirementSatisfied(state, technology.prerequisites || {})) {
    throw new Error(`科技 ${techId} 前置条件未满足`)
  }

  const nextResourceCounts: Record<string, number> = { ...state.resourceCounts }
  for (const [resourceId, cost] of Object.entries(technology.cost)) {
    if ((nextResourceCounts[resourceId] || 0) < cost) {
      throw new Error(`研究科技 ${techId} 所需资源 ${resourceId} 不足（需要 ${cost}，当前 ${nextResourceCounts[resourceId] || 0}）`)
    }
  }

  for (const [resourceId, cost] of Object.entries(technology.cost)) {
    nextResourceCounts[resourceId] -= cost
  }

  return {
    ...state,
    resourceCounts: nextResourceCounts,
    researchedTechIds: [...state.researchedTechIds, technology.id],
  }
}

export function getUnlockedBuildingsIds(state: GameState): string[] {
  return BUILDINGS.filter((building) => isRequirementSatisfied(state, building)).map((building) => building.id)
}

export function isJobVisible(state: GameState, jobId: string): boolean {
  const job = JOBS.find((item) => item.id === jobId)
  if (!job) {
    throw new Error(`职业 ${jobId} 不存在`)
  }

  return isRequirementSatisfied(state, job.prerequisites || {})
}

export function getVisibleJobsIds(state: GameState): string[] {
  return JOBS
    .filter((job) => isRequirementSatisfied(state, job.prerequisites || {}))
    .map((job) => job.id)

  }

export function getUnlockedJobsIds(state: GameState): string[] {
  return getVisibleJobsIds(state)
}
