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
  isToggleable?: boolean
  consumptionPerTick?: Record<string, number>

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
  value: number
}

export interface Policy {
  id: string
  name: string
  description: string
  effects?: Effect[]
}

export interface PolicyGroup {
  policyIds: string[]
  cost: Record<string, number>
  prerequisites?: RequirementCarrier
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

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export interface Calendar {
  year: number
  month: number
  day: number
  season: Season
}

export const MONTH_TO_SEASON: Record<number, Season> = {
  1: 'winter',
  2: 'winter',
  3: 'spring',
  4: 'spring',
  5: 'spring',
  6: 'summer',
  7: 'summer',
  8: 'summer',
  9: 'autumn',
  10: 'autumn',
  11: 'autumn',
  12: 'winter',
}

export const SEASON_EFFECTS: Record<Season, Effect[]> = {
  spring: [
    {
      id: 'spring-farm-bonus',
      type: 'building_production',
      targetId: 'farm',
      value: 1.15,
      mode: 'multiplier',
    },
  ],
  summer: [
    {
      id: 'summer-farm-bonus',
      type: 'building_production',
      targetId: 'farm',
      value: 1.5,
      mode: 'multiplier',
    },
  ],
  autumn: [],
  winter: [
    {
      id: 'winter-farm-bonus',
      type: 'building_production',
      targetId: 'farm',
      value: 0.25,
      mode: 'multiplier',
    },
  ],
}

export type GameEvent = { type: 'death'; dogId: string; dogName: string }

export type GameLogType = 'death' | 'explore'

export interface GameLog {
  id: string
  timestamp: number
  type: GameLogType
  message: string
  count?: number
}

export type DogStatus = 'idle' | 'working' | 'exploring'

export interface Trait {
  id: string
  name: string
  description: string
  effect: Effect
}

export interface Dog {
  id: string
  name: string
  color: string
  age: number
  experienceByJob: Record<string, number>
  traitId: string
  status: DogStatus
  currentJobId: string | null
}

export interface GameState {
  resourceCounts: Record<string, number>
  buildings: Record<string, number>
  buildingActiveCounts: Record<string, number>
  researchedTechIds: string[]
  workshopUnlockIds: string[]
  enactedPolicyIds: string[]

  dogs: Dog[]
  populationGrowthProgress: number
  populationCap: number
  leaderDogId: string | null

  isDomesticateEnabled: boolean

  tickCount: number
  lastTickTime: number
}

export const RESOURCES: Resource[] = [
  { id: 'food', name: '食物', icon: '🍖' },
  { id: 'wood', name: '木材', icon: '🪵' },
  { id: 'stone', name: '石材', icon: '🪨' },
  { id: 'iron', name: '铁矿', icon: '⛓️' },
  { id: 'coal', name: '煤炭', icon: '🪨' },
  { id: 'gold', name: '黄金', icon: '🥇' },
  { id: 'science', name: '科学', icon: '🔬' },
  { id: 'culture', name: '文化', icon: '🎨' },
  { id: 'dogpower', name: '汪力', icon: '🐾' },
  { id: 'fur', name: '毛皮', icon: '🧥' },
]

export const JOBS: Job[] = [
  {
    id: 'farmer',
    name: '农夫',
    icon: '🌾',
    description: '稳定生产食物，是扩张狗口前最可靠的岗位。',
    productionPerTick: { food: 0.9 },
    prerequisites: {
      requiredBuildings: ['farm'],
    },
  },
  {
    id: 'lumberjack',
    name: '伐木工',
    icon: '🪓',
    description: '采集木材，用于狗舍、仓库和图书馆。',
    productionPerTick: { wood: 0.35 },
  },
  {
    id: 'miner',
    name: '矿工',
    icon: '⛏️',
    description: '采集石材，支撑工坊装备与冶炼。',
    productionPerTick: { stone: 0.32 },
    prerequisites: {
      requiredWorkshopUnlockIds: ['wood_pickaxe'],
    },
  },
  {
    id: 'scientist',
    name: '科学家',
    icon: '🔬',
    description: '产出科学点，用于解锁新的建筑、工具和制度。',
    productionPerTick: { science: 0.18 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
  },
  {
    id: 'hunter',
    name: '猎人',
    icon: '🏹',
    description: '积累汪力，满额后可发起野外探索。',
    productionPerTick: { dogpower: 0.22 },
  },
  {
    id: 'artist',
    name: '艺术家',
    icon: '🎨',
    description: '创作文化，用于启用长期政策。',
    productionPerTick: { culture: 0.16 },
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
    cost: { wood: 24 },
    costGrowthMultiplier: 1.65,
    populationCapBonus: 2,
    resourceLimitBonuses: { dogpower: 100 },
  },
  {
    id: 'farm',
    name: '农场',
    icon: '🌾',
    description: '被动产出少量食物，并解锁农夫岗位。',
    cost: { food: 12 },
    costGrowthMultiplier: 1.18,
    productionPerTick: { food: 0.15 },
  },
  {
    id: 'warehouse',
    name: '仓库',
    icon: '📦',
    description: '提升食物、木材、石头与毛皮的存储上限。',
    cost: { wood: 36 },
    costGrowthMultiplier: 1.8,
    resourceLimitBonuses: { food: 250, wood: 220, stone: 220, fur: 140 },
  },
  {
    id: 'library',
    name: '图书馆',
    icon: '📚',
    description: '解锁科技研究，提升科学产出并增加科学存储上限。',
    cost: { wood: 70 },
    costGrowthMultiplier: 1.75,
    resourceLimitBonuses: { science: 260, culture: 120 },
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
    cost: { wood: 90, science: 30 },
    costGrowthMultiplier: 1.65,
    requiredTechs: ['workshop_engineering'],
  },
  {
    id: 'smelter',
    name: '熔炉',
    icon: '🔥',
    description: '消耗木材与石料，生产铁矿。',
    cost: { wood: 80, stone: 60, science: 40 },
    costGrowthMultiplier: 1.3,
    isToggleable: true,
    consumptionPerTick: { wood: 0.8, stone: 0.8 },
    productionPerTick: { iron: 0.55 },
    requiredTechs: ['mining'],
  },
]

export const POLICIES: Policy[] = [
  {
    id: 'policy-democracy',
    name: '民主',
    description: '鼓励公民参与与文化表达，明显提升文化产出。',
    effects: [
      {
        id: 'policy-democracy-artist-bonus',
        type: 'job_production',
        targetId: 'artist',
        value: 1.35,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-authoritarian',
    name: '专制',
    description: '集中资源以提高基础生产，但抑制文化创作。',
    effects: [
      {
        id: 'policy-authoritarian-farmer-bonus',
        type: 'job_production',
        targetId: 'farmer',
        value: 1.3,
        mode: 'multiplier',
      },
      {
        id: 'policy-authoritarian-artist-penalty',
        type: 'job_production',
        targetId: 'artist',
        value: 0.75,
        mode: 'multiplier',
      },
    ],
  },

  {
    id: 'policy-radical',
    name: '激进',
    description: '推动快速变革，优先科研与创新。',
    effects: [
      {
        id: 'policy-radical-scientist-bonus',
        type: 'job_production',
        targetId: 'scientist',
        value: 1.35,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-conservative',
    name: '保守',
    description: '维护传统与稳定，优先农业与资源积累。',
    effects: [
      {
        id: 'policy-conservative-farmer-bonus',
        type: 'job_production',
        targetId: 'farmer',
        value: 1.35,
        mode: 'multiplier',
      },
    ],
  },

  {
    id: 'policy-environment',
    name: '环保优先',
    description: '优先环境保护，显著提升基础资源储备。',
    effects: [
      {
        id: 'policy-environment-resource-limit-food',
        type: 'resource_limit',
        targetId: 'food',
        value: 1.4,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-development',
    name: '发展优先',
    description: '优先发展经济与产能，提升生产效率。',
    effects: [
      {
        id: 'policy-development-farm-output',
        type: 'building_production',
        targetId: 'farm',
        value: 1.25,
        mode: 'multiplier',
      },
    ],
  },
]

export const POLICY_GROUPS: PolicyGroup[] = [
  {
    policyIds: ['policy-democracy', 'policy-authoritarian'],
    cost: { culture: 80 },
    prerequisites: { requiredBuildings: ['library'] },
  },
  {
    policyIds: ['policy-radical', 'policy-conservative'],
    cost: { culture: 140 },
    prerequisites: { requiredBuildings: ['workshop'] },
  },
  {
    policyIds: ['policy-environment', 'policy-development'],
    cost: { culture: 260 },
    prerequisites: { requiredBuildings: ['library'] },
  },
]

export const TECHNOLOGIES: Technology[] = [
  {
    id: 'workshop_engineering',
    name: '工坊工程',
    description: '掌握基础工坊建造技术，解锁工坊建筑。',
    cost: { science: 45 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [],
  },
  {
    id: 'mining',
    name: '采矿术',
    description: '学习基本采矿技术，解锁木镐与采石岗位。',
    cost: { science: 90 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [],
  },
  {
    id: 'crop_rotation',
    name: '轮作农法',
    description: '农场效率提高 20%，且建造成本略有下降。',
    cost: { science: 180 },
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
    cost: { science: 220, wood: 80 },
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
    id: 'calendar',
    name: '历法',
    description: '解锁季节显示，农作物产量将随季节变化。',
    cost: { science: 320 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [],
  },
  {
    id: 'administration',
    name: '管理学',
    description: '解锁领导系统。',
    cost: { science: 260, culture: 60 },
    prerequisites: {
      requiredBuildings: ['workshop'],
    },
  },
]

export const WORKSHOP_UNLOCKS: WorkshopUnlock[] = [
  {
    id: 'wood_pickaxe',
    name: '木镐',
    description: '制作基础木镐，为采石与采矿岗位提供工具。',
    cost: { wood: 60, science: 40 },
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
    cost: { wood: 120, stone: 90, science: 120 },
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
    cost: { wood: 90, stone: 120, fur: 40, science: 120 },
    prerequisites: {
      requiredBuildings: ['workshop'],
      requiredWorkshopUnlockIds: ['stone_pickaxe'],
    },
    effects: [],
  },
]

export const TRAITS: Trait[] = [
  {
    id: 'scientist',
    name: '科学家',
    description: '提升科学研究效率。',
    effect: {
      id: 'trait-scientist-job-production',
      type: 'job_production',
      targetId: 'scientist',
      value: 1.1,
      mode: 'multiplier',
    },
  },
  {
    id: 'agriculturalist',
    name: '农学家',
    description: '提高农业效率。',
    effect: {
      id: 'trait-agriculturalist-job-production',
      type: 'job_production',
      targetId: 'farmer',
      value: 1.1,
      mode: 'multiplier',
    },
  },
]
