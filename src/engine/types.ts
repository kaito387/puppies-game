export interface Resource {
  id: string
  name: string
  icon?: string
}

export interface Building {
  id: string
  name: string
  icon?: string
  description: string
  cost: Record<string, number>
  costGrowthMultiplier: number

  productionPerTick?: Record<string, number>
  requiredTechs?: string[]
  requiredBuildings?: string[]
  resourceLimitBonuses?: Record<string, number>
  populationCapBonus?: number
}

export interface Job {
  id: string
  name: string
  icon?: string
  description: string
  productionPerTick: Record<string, number>
  requiredTechs?: string[]
  requiredBuildings?: string[]
}

export type EffectMode = 'multiplier' | 'additive'

export type EffectType =
  | 'building_cost'
  | 'building_production'
  | 'job_production'
  | 'resource_limit'

export interface RequirementCarrier {
  requiredTechs?: string[]
  requiredBuildings?: string[]
}

export interface Effect {
  id: string
  type: EffectType
  mode: EffectMode
  targetId?: string
  resourceId?: string
  value: number
}

export interface Technology {
  id: string
  name: string
  description: string
  cost: Record<string, number>
  prerequisites?: RequirementCarrier
  effects?: Effect[]
}

export type GameLogType = 'death' | 'building_constructed' | 'tech_researched'

export interface GameLog {
  id: string
  timestamp: number
  type: GameLogType
  message: string
  count?: number
}

export interface GameState {
  resourceCounts: Record<string, number>
  resourceLimits: Record<string, number>
  resourceDeltaPerTick: Record<string, number>
  buildings: Record<string, number>
  jobAssignments: Record<string, number>
  researchedTechIds: string[]

  population: number
  populationGrowthProgress: number
  populationCap: number
  
  isDomesticateEnabled: boolean

  tickCount: number
  lastTickTime: number
  
  logs: GameLog[]
}

export const RESOURCES: Resource[] = [
  { id: 'food', name: '食物', icon: '🍖' },
  { id: 'wood', name: '木材', icon: '🪵' },
  { id: 'science', name: '科学', icon: '🔬' },
]

export const INITIAL_RESOURCE_LIMITS: Record<string, number> = {
  food: 3000,
  wood: 400,
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
    requiredBuildings: ['farm'],
  },
  {
    id: 'lumberjack',
    name: '伐木工',
    icon: '🪓',
    description: '每 Tick 采集木材。',
    productionPerTick: { wood: 0.2 },
  },
  {
    id: 'scientist',
    name: '科学家',
    icon: '🔬',
    description: '每 Tick 进行科学研究。',
    productionPerTick: { science: 0.2 },
    requiredBuildings: ['library'],
  }
]

export const BUILDINGS: Building[] = [
  {
    id: 'barn',
    name: '狗舍',
    icon: '🏠',
    description: '可以容纳 2 只小狗。',
    cost: { wood: 10, food: 75 },
    costGrowthMultiplier: 2.5,
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
    description: '提升食物与木材的存储上限。',
    cost: { wood: 200 },
    costGrowthMultiplier: 2.5,
    resourceLimitBonuses: { food: 3000, wood: 400 },
  },
  {
    id: 'library',
    name: '图书馆',
    icon: '📚',
    description: '解锁科技研究，提升科学产出并增加科学存储上限。',
    cost: { wood: 25, food: 100 },
    costGrowthMultiplier: 2,
    resourceLimitBonuses: { science: 200 },
  }
]

export const TECHNOLOGIES: Technology[] = [
  {
    id: 'woodworking',
    name: '木工学',
    description: '改良木材处理效率，提升伐木工的产量 20%。',
    cost: { science: 100 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [
      {
        id: 'woodworking-lumberjack-bonus',
        type: 'job_production',
        targetId: 'lumberjack',
        value: 1.2,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'crop_rotation',
    name: '轮作农法',
    description: '农场效率提高 20%，且建造成本略有下降。',
    cost: { science: 200 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [
      {
        id: 'crop-rotation-farm-output',
        type: 'building_production',
        targetId: 'farm',
        value: 1.2,
        mode: 'multiplier',
      },
      {
        id: 'crop-rotation-farm-cost',
        type: 'building_cost',
        targetId: 'farm',
        value: 0.8,
        mode: 'multiplier',
      },
    ],
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
    researchedTechIds: [],
    population: 0,
    populationCap: INITIAL_POPULATION_CAP,
    isDomesticateEnabled: false,
    populationGrowthProgress: 0,
    tickCount: 0,
    lastTickTime: Date.now(),
    logs: [],
  }
}

const MAX_LOGS = 100

export function addLog(state: GameState, log: Omit<GameLog, 'id'>): GameState {
  const newLog: GameLog = {
    ...log,
    id: `${log.type}-${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
  }
  
  const updatedLogs = [newLog, ...state.logs].slice(0, MAX_LOGS)
  
  return {
    ...state,
    logs: updatedLogs,
  }
}
