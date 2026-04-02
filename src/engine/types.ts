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
  resourceDeltaPerTick: Record<string, number>
  buildings: Record<string, number>
  jobAssignments: Record<string, number>

  population: number
  populationGrowthProgress: number
  populationCap: number
  
  isDomesticateEnabled: boolean

  tickCount: number
  lastTickTime: number
}

export const RESOURCES: Resource[] = [
  { id: 'food', name: '食物', icon: '🍖' },
  { id: 'bones', name: '骨头', icon: '🦴' },
]

export const INITIAL_RESOURCE_LIMITS: Record<string, number> = {
  food: 5000,
  bones: 300,
}

export const INITIAL_POPULATION_CAP = 1
export const POPULATION_GROWTH_RATE = 0.02
export const FOOD_CONSUMPTION_PER_PUPPY_PER_TICK = 1.2

export const JOBS: Job[] = [
  {
    id: 'farmer',
    name: '农夫',
    icon: '🌾',
    description: '每 Tick 生产食物。',
    productionPerTick: { food: 1.5 },
  },
  {
    id: 'hunter',
    name: '猎手',
    icon: '🏹',
    description: '每 Tick 采集骨头。',
    productionPerTick: { bones: 0.2 },
  },
]

export const BUILDINGS: Building[] = [
  {
    id: 'barn',
    name: '狗舍',
    icon: '🏠',
    description: '可以容纳 2 只小狗。',
    cost: { bones: 10, food: 100 },
    costGrowthMultiplier: 2.5,
    productionPerTick: {},
    populationCapBonus: 2,
  },
  {
    id: 'farm',
    name: '农场',
    icon: '🌾',
    description: '每秒生产 1 份食物',
    cost: { food: 10 },
    costGrowthMultiplier: 1.12,
    productionPerTick: { food: 0.2 },
  },
  {
    id: 'warehouse',
    name: '仓库',
    icon: '📦',
    description: '提升食物与骨头的存储上限。',
    cost: { bones: 300 },
    costGrowthMultiplier: 2.5,
    productionPerTick: {},
    resourceLimitBonuses: { food: 5000, bones: 300 },
  },
]

export function createInitialResourceLimits(): Record<string, number> {
  const limits: Record<string, number> = structuredClone(INITIAL_RESOURCE_LIMITS)
  return limits
}

export function createInitialResourceDeltaPerTick(): Record<string, number> {
  const deltas: Record<string, number> = {}
  RESOURCES.forEach((resource) => {
    deltas[resource.id] = 0
  })

  return deltas
}

export function createInitialGameState(): GameState {
  const resources: Record<string, number> = {}
  RESOURCES.forEach((resource) => {
    resources[resource.id] = 0
  })

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
    resourceDeltaPerTick: createInitialResourceDeltaPerTick(),
    buildings,
    jobAssignments,
    population: 0,
    populationCap: INITIAL_POPULATION_CAP,
    isDomesticateEnabled: false,
    populationGrowthProgress: 0,
    tickCount: 0,
    lastTickTime: Date.now(),
  }
}
