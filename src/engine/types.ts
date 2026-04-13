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
  Effects?: Effect[]
}

export interface Job {
  id: string
  name: string
  icon?: string
  description: string
  productionPerTick: Record<string, number>
  prerequisites?: RequirementCarrier
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
  requiredWorkshopUnlockIds?: string[]
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

export interface WorkshopUnlock {
  id: string
  name: string
  description: string
  cost: Record<string, number>
  prerequisites?: RequirementCarrier
  effects?: Effect[]
}

export type GameEvent = { type: 'death'; dogId: string; dogName: string }

export type GameLogType = 'death'

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
  workshopUnlockIds: string[]

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
    prerequisites: {
      requiredBuildings: ['farm'],
    },
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
    prerequisites: {
      requiredWorkshopUnlockIds: ['wood_pickaxe'],
    },
  },
  {
    id: 'scientist',
    name: '科学家',
    icon: '🔬',
    description: '每 Tick 进行科学研究。',
    productionPerTick: { science: 0.2 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
  },
]

export const BUILDINGS: Building[] = [
  {
    id: 'barn',
    name: '狗舍',
    icon: '🏠',
    description: '可以容纳 2 只小狗。',
    cost: { wood: 20 },
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
    cost: { wood: 25 },
    costGrowthMultiplier: 2,
    resourceLimitBonuses: { science: 1500 },
    Effects: [
      {
        id: 'library-science-efficiency',
        type: 'job_production',
        targetId: 'scientist',
        value: 0.1,
        mode: 'additive',
      },
    ],
  },
  {
    id: 'workshop',
    name: '工坊',
    icon: '🛠️',
    description: '用于制造工具与探索装备。',
    cost: { wood: 60 },
    costGrowthMultiplier: 1.8,
    requiredTechs: ['workshop_engineering'],
  },
]

export const TECHNOLOGIES: Technology[] = [
  {
    id: 'workshop_engineering',
    name: '工坊工程',
    description: '掌握基础工坊建造技术，解锁工坊建筑。',
    cost: { science: 60 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [],
  },
  {
    id: 'mining',
    name: '采矿术',
    description: '学习基本的采矿技术。',
    cost: { science: 150 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [],
  },
  {
    id: 'crop_rotation',
    name: '轮作农法',
    description: '农场效率提高 20%，且建造成本略有下降。',
    cost: { science: 300 },
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
    id: 'woodworking',
    name: '木工学',
    description: '改良木材处理效率，提升伐木工的产量 20%。',
    cost: { science: 600, wood: 200 },
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
]

export const WORKSHOP_UNLOCKS: WorkshopUnlock[] = [
  {
    id: 'wood_pickaxe',
    name: '木镐',
    description: '制作基础木镐，为采石与采矿岗位提供工具。',
    cost: { wood: 80, science: 60 },
    prerequisites: {
      requiredTechs: ['mining'],
      requiredBuildings: ['workshop'],
    },
    effects: [],
  },
  {
    id: 'stone_pickaxe',
    name: '石镐',
    description: '升级矿工具，提升矿工产量。',
    cost: { wood: 240, stone: 120, science: 300 },
    prerequisites: {
      requiredBuildings: ['workshop'],
      requiredWorkshopUnlockIds: ['wood_pickaxe'],
    },
    effects: [
      {
        id: 'stone-pickaxe-miner-output',
        type: 'job_production',
        targetId: 'miner',
        value: 1.5,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'exploration_gear',
    name: '探索装备',
    description: '整备探索队所需的工具与补给。',
    cost: { wood: 150, stone: 150, science: 150 },
    prerequisites: {
      requiredBuildings: ['workshop'],
      requiredWorkshopUnlockIds: ['stone_pickaxe'],
    },
    effects: [],
  },
]
