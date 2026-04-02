export interface Resource {
  id: string
  name: string
  icon?: string // TODO Optional
}
// TODO 资源可以区分浮点数和整数

export interface Building {
  id: string
  name: string
  icon?: string // TODO Optional
  description: string
  cost: Record<string, number>
  costGrowthMultiplier: number
  productionPerTick: Record<string, number>
  resourceLimitBonuses?: Record<string, number>
  populationCapBonus?: number
}

export interface Job {
  id: string
  name: string
  icon?: string
  description: string
  productionPerTick: Record<string, number>
}

export interface GameState {
  resourceCounts: Record<string, number>
  resourceLimits: Record<string, number>
  buildings: Record<string, number>
  jobAssignments: Record<string, number>
  populationGrowthProgress: number

  tickCount: number
  lastTickTime: number
}

export const RESOURCES: Resource[] = [
  { id: 'puppies', name: '小狗', icon: '🐕' },
  { id: 'food', name: '食物', icon: '🍖' },
  { id: 'bones', name: '骨头', icon: '🦴' },
]

export const RESOURCE_LIMITS: Record<string, number> = {
  puppies: 1,
  food: 100,
  bones: 100,
}

export const BASE_POPULATION_CAP = 1
export const POPULATION_GROWTH_BASE_RATE = 0.06
export const FOOD_CONSUMPTION_PER_PUPPY_PER_TICK = 1

export const JOBS: Job[] = [
  {
    id: 'farmer',
    name: '农夫',
    icon: '🌾',
    description: '每 Tick 生产食物。',
    productionPerTick: { food: 1 },
  },
  {
    id: 'hunter',
    name: '猎手',
    icon: '🏹',
    description: '每 Tick 采集骨头。',
    productionPerTick: { bones: 0.08 },
  },
]

export const BUILDINGS: Building[] = [
  {
    id: 'barn',
    name: '狗舍',
    icon: '🏠',
    description: '可以容纳 2 只小狗。',
    cost: { bones: 10 },
    costGrowthMultiplier: 2.5,
    productionPerTick: {},
    populationCapBonus: 2,
  },
  {
    id: 'farm',
    name: '农场',
    icon: '🌾',
    description: '每秒生产 1 份食物',
    cost: { bones: 20 },
    costGrowthMultiplier: 1.12,
    productionPerTick: { food: 0.2 },
  },
  {
    id: 'warehouse',
    name: '仓库',
    icon: '📦',
    description: '提升食物与骨头的存储上限。',
    cost: { bones: 30 },
    costGrowthMultiplier: 1.12,
    productionPerTick: {},
    resourceLimitBonuses: { food: 200, bones: 200 },
  },
]

export function createInitialResourceLimits(): Record<string, number> {
  const limits: Record<string, number> = structuredClone(RESOURCE_LIMITS)
  return limits
}

export function createInitialGameState(): GameState {
  const resources: Record<string, number> = {}
  RESOURCES.forEach((resource) => {
    resources[resource.id] = 0
  })
  resources.puppies = 1

  const buildings: Record<string, number> = {}
  BUILDINGS.forEach((building) => {
    buildings[building.id] = 0
  })

  const jobAssignments: Record<string, number> = {}
  JOBS.forEach((job) => {
    jobAssignments[job.id] = 0
  })

  return {
    resourceCounts: resources,
    resourceLimits: createInitialResourceLimits(),
    buildings,
    jobAssignments,
    populationGrowthProgress: 0,
    tickCount: 0,
    lastTickTime: Date.now(),
  }
}
