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

export type GameEvent =
  | { type: 'death'; dogId: string; dogName: string }

export type GameLogType =
  | 'death'

export interface GameLog {
  id: string
  timestamp: number
  type: GameLogType
  message: string
  count?: number
}

export type DogStatus = 'idle' | 'working' | 'exploring'

export interface Dog {
  id: string
  name: string
  age: number
  experienceByJob: Record<string, number>
  talentJobId: string
  status: DogStatus
  currentJobId: string | null
}

export interface GameState {
  resourceCounts: Record<string, number>
  buildings: Record<string, number>
  researchedTechIds: string[]

  dogs: Dog[]
  populationGrowthProgress: number
  populationCap: number
  
  isDomesticateEnabled: boolean

  tickCount: number
  lastTickTime: number
}

export const RESOURCES: Resource[] = [
  { id: 'food', name: '食物', icon: '🍖' },
  { id: 'wood', name: '木材', icon: '🪵' },
  { id: 'stone', name: '石材', icon: '🪨' },
  { id: 'science', name: '科学', icon: '🔬' },
]

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
    id: 'miner',
    name: '矿工',
    icon: '⛏️',
    description: '每 Tick 采集石材。',
    productionPerTick: { stone: 0.2 },
    requiredTechs: ['mining'],
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
    cost: { wood: 20, food: 80 },
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
    cost: { wood: 50 },
    costGrowthMultiplier: 2,
    resourceLimitBonuses: { food: 5000, wood: 1000, stone: 1000 },
  },
  {
    id: 'library',
    name: '图书馆',
    icon: '📚',
    description: '解锁科技研究，提升科学产出并增加科学存储上限。',
    cost: { wood: 25, food: 100 },
    costGrowthMultiplier: 2,
    resourceLimitBonuses: { science: 1500 },
  }
]

export const TECHNOLOGIES: Technology[] = [
  {
    id: 'woodworking',
    name: '木工学',
    description: '改良木材处理效率，提升伐木工的产量 20%。',
    cost: { science: 800 },
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
    cost: { science: 500 },
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
  {
    id: 'mining',
    name: '采矿术',
    description: '学习基本的采矿技术，解锁矿工职业。',
    cost: { science: 150 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [],
  }
]
