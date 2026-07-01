import { BUILDINGS, JOBS, RESOURCES, type Effect, type RequirementCarrier } from '@/engine/types'

const resourceNameById = new Map(RESOURCES.map((resource) => [resource.id, resource.name]))
const buildingNameById = new Map(BUILDINGS.map((building) => [building.id, building.name]))
const jobNameById = new Map(JOBS.map((job) => [job.id, job.name]))

export function getResourceName(resourceId: string): string {
  return resourceNameById.get(resourceId) || resourceId
}

export function formatAmount(amount: number): string {
  if (Math.abs(amount) < 10) {
    return amount.toFixed(1).replace(/\.0$/, '')
  }

  return Math.round(amount).toString()
}

export function formatResourceList(resources: Record<string, number>): string {
  const entries = Object.entries(resources)
  if (entries.length === 0) {
    return '无'
  }

  return entries
    .map(([resourceId, amount]) => `${formatAmount(amount)} ${getResourceName(resourceId)}`)
    .join(' + ')
}

export function describeRequirements(requirements: RequirementCarrier = {}): string {
  const parts: string[] = []

  if (requirements.requiredBuildings?.length) {
    parts.push(
      `建筑 ${requirements.requiredBuildings
        .map((buildingId) => buildingNameById.get(buildingId) || buildingId)
        .join('、')}`,
    )
  }

  if (requirements.requiredTechs?.length) {
    parts.push(`科技 ${requirements.requiredTechs.join('、')}`)
  }

  if (requirements.requiredWorkshopUnlockIds?.length) {
    parts.push(`工坊 ${requirements.requiredWorkshopUnlockIds.join('、')}`)
  }

  if (requirements.requiredTickCount !== undefined) {
    const days = Math.ceil(requirements.requiredTickCount / (24 * 60 * 60 * 5))
    parts.push(`运行第 ${days} 天`)
  }

  return parts.join('；')
}

export function describeEffect(effect: Effect): string {
  const targetName =
    effect.targetId &&
    (jobNameById.get(effect.targetId) ||
      buildingNameById.get(effect.targetId) ||
      getResourceName(effect.targetId))

  const valueText =
    effect.mode === 'multiplier'
      ? `x${formatAmount(effect.value)}`
      : effect.value > 0
        ? `+${formatAmount(effect.value * 100)}%`
        : `${formatAmount(effect.value * 100)}%`

  if (effect.type === 'job_production') {
    return `${targetName || '职业'}产出 ${valueText}`
  }

  if (effect.type === 'building_production') {
    return `${targetName || '建筑'}产出 ${valueText}`
  }

  if (effect.type === 'building_cost') {
    return `${targetName || '建筑'}成本 ${valueText}`
  }

  if (effect.type === 'resource_limit') {
    return `${targetName || '资源'}上限 ${valueText}`
  }

  return `效果 ${valueText}`
}
