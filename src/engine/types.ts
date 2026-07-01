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
  requiredWorkshopUnlockIds?: string[]
  requiredTickCount?: number
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
  requiredTickCount?: number
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

export const REALTIME_DAY_TICKS = 24 * 60 * 60 * 5

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
  {
    id: 'forester',
    name: '护林员',
    icon: '🌲',
    description: '维护林地并稳定提供木材，适合中期扩大建筑队列。',
    productionPerTick: { wood: 0.55 },
    prerequisites: {
      requiredTechs: ['forestry'],
    },
  },
  {
    id: 'engineer',
    name: '工程师',
    icon: '📐',
    description: '把工坊经验转化为科学与汪力，推动中后期工程。',
    productionPerTick: { science: 0.14, dogpower: 0.12 },
    prerequisites: {
      requiredBuildings: ['workshop'],
      requiredTechs: ['metalworking'],
    },
  },
  {
    id: 'merchant',
    name: '商贩',
    icon: '💱',
    description: '经营集市，产出黄金与少量文化。',
    productionPerTick: { gold: 0.12, culture: 0.06 },
    prerequisites: {
      requiredBuildings: ['market'],
    },
  },
  {
    id: 'prospector',
    name: '探矿犬',
    icon: '🧭',
    description: '深入矿脉寻找稀有矿物，产出黄金与石材。',
    productionPerTick: { gold: 0.08, stone: 0.18 },
    prerequisites: {
      requiredWorkshopUnlockIds: ['survey_compass'],
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
    id: 'granary',
    name: '粮仓',
    icon: '🌽',
    description: '提升食物储备并改善农场调度。',
    cost: { wood: 70, food: 80 },
    costGrowthMultiplier: 1.7,
    requiredBuildings: ['warehouse'],
    resourceLimitBonuses: { food: 480 },
    Effects: [
      {
        id: 'granary-farm-output',
        type: 'building_production',
        targetId: 'farm',
        value: 0.08,
        mode: 'additive',
      },
    ],
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
    id: 'quarry',
    name: '采石场',
    icon: '⛰️',
    description: '被动产出石材，并扩大石材存储。',
    cost: { wood: 120, stone: 80, science: 60 },
    costGrowthMultiplier: 1.55,
    productionPerTick: { stone: 0.22 },
    requiredTechs: ['masonry'],
    requiredWorkshopUnlockIds: ['wood_pickaxe'],
    resourceLimitBonuses: { stone: 420 },
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
    id: 'kennel',
    name: '训练犬舍',
    icon: '🐕',
    description: '容纳更多工作犬，并强化汪力储备。',
    cost: { wood: 160, fur: 80, culture: 60 },
    costGrowthMultiplier: 1.85,
    requiredTechs: ['animal_husbandry'],
    populationCapBonus: 4,
    resourceLimitBonuses: { dogpower: 180, fur: 120 },
  },
  {
    id: 'charcoal_kiln',
    name: '炭窑',
    icon: '♨️',
    description: '消耗木材，生产煤炭。',
    cost: { wood: 180, stone: 120, science: 90 },
    costGrowthMultiplier: 1.45,
    isToggleable: true,
    consumptionPerTick: { wood: 0.55 },
    productionPerTick: { coal: 0.38 },
    requiredTechs: ['charcoal_burning'],
    resourceLimitBonuses: { coal: 180 },
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
    resourceLimitBonuses: { iron: 180 },
  },
  {
    id: 'academy',
    name: '学院',
    icon: '🏛️',
    description: '培养科学家和工程师，扩大科学与文化上限。',
    cost: { wood: 220, stone: 160, science: 220, culture: 80 },
    costGrowthMultiplier: 1.75,
    requiredTechs: ['education'],
    resourceLimitBonuses: { science: 520, culture: 260 },
    Effects: [
      {
        id: 'academy-scientist-output',
        type: 'job_production',
        targetId: 'scientist',
        value: 0.12,
        mode: 'additive',
      },
      {
        id: 'academy-engineer-output',
        type: 'job_production',
        targetId: 'engineer',
        value: 0.1,
        mode: 'additive',
      },
    ],
  },
  {
    id: 'market',
    name: '集市',
    icon: '🏪',
    description: '解锁商贩岗位，并让黄金成为中后期政策资源。',
    cost: { wood: 260, stone: 120, fur: 120, culture: 120 },
    costGrowthMultiplier: 1.6,
    productionPerTick: { gold: 0.03 },
    requiredTechs: ['economics'],
    resourceLimitBonuses: { gold: 180, culture: 220 },
  },
  {
    id: 'observatory',
    name: '观星台',
    icon: '🔭',
    description: '长期科研建筑，支撑后期高阶科技。',
    cost: { stone: 5200, iron: 520, gold: 420, science: 5200 },
    costGrowthMultiplier: 1.7,
    productionPerTick: { science: 0.3 },
    requiredTechs: ['astronomy'],
    resourceLimitBonuses: { science: 3600, gold: 900 },
  },
  {
    id: 'mint',
    name: '铸币所',
    icon: '🪙',
    description: '消耗铁矿与煤炭，铸造黄金。',
    cost: { stone: 4200, iron: 720, coal: 520, science: 3600 },
    costGrowthMultiplier: 1.5,
    isToggleable: true,
    consumptionPerTick: { iron: 0.35, coal: 0.3 },
    productionPerTick: { gold: 0.22 },
    requiredTechs: ['banking'],
  },
  {
    id: 'monument',
    name: '纪念碑',
    icon: '🗿',
    description: '提升文化产出与制度容量，是长期政策路线的核心建筑。',
    cost: { stone: 6800, gold: 900, culture: 5200 },
    costGrowthMultiplier: 1.8,
    productionPerTick: { culture: 0.28 },
    requiredTechs: ['civil_service'],
    resourceLimitBonuses: { culture: 900 },
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
  {
    id: 'policy-guilds',
    name: '行会制度',
    description: '强化专业技艺，提升工程师与矿工效率。',
    effects: [
      {
        id: 'policy-guilds-engineer-bonus',
        type: 'job_production',
        targetId: 'engineer',
        value: 1.3,
        mode: 'multiplier',
      },
      {
        id: 'policy-guilds-miner-bonus',
        type: 'job_production',
        targetId: 'miner',
        value: 1.2,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-free-market',
    name: '自由市场',
    description: '鼓励交易和流通，提升商贩与集市收益。',
    effects: [
      {
        id: 'policy-free-market-merchant-bonus',
        type: 'job_production',
        targetId: 'merchant',
        value: 1.45,
        mode: 'multiplier',
      },
      {
        id: 'policy-free-market-market-bonus',
        type: 'building_production',
        targetId: 'market',
        value: 1.35,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-frontier',
    name: '边境开拓',
    description: '把汪力投入远征，提升猎人与探矿犬收益。',
    effects: [
      {
        id: 'policy-frontier-hunter-bonus',
        type: 'job_production',
        targetId: 'hunter',
        value: 1.35,
        mode: 'multiplier',
      },
      {
        id: 'policy-frontier-prospector-bonus',
        type: 'job_production',
        targetId: 'prospector',
        value: 1.25,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-homeland',
    name: '家园建设',
    description: '优先稳定内政，提升狗口与基础储备。',
    effects: [
      {
        id: 'policy-homeland-food-limit',
        type: 'resource_limit',
        targetId: 'food',
        value: 1.25,
        mode: 'multiplier',
      },
      {
        id: 'policy-homeland-culture-limit',
        type: 'resource_limit',
        targetId: 'culture',
        value: 1.25,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-scholasticism',
    name: '学院派',
    description: '把黄金投入长期研究，显著提升科学体系。',
    effects: [
      {
        id: 'policy-scholasticism-scientist-bonus',
        type: 'job_production',
        targetId: 'scientist',
        value: 1.45,
        mode: 'multiplier',
      },
      {
        id: 'policy-scholasticism-observatory-bonus',
        type: 'building_production',
        targetId: 'observatory',
        value: 1.35,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'policy-festivals',
    name: '节庆传统',
    description: '把富余资源投入文化凝聚，强化艺术家与纪念碑。',
    effects: [
      {
        id: 'policy-festivals-artist-bonus',
        type: 'job_production',
        targetId: 'artist',
        value: 1.45,
        mode: 'multiplier',
      },
      {
        id: 'policy-festivals-monument-bonus',
        type: 'building_production',
        targetId: 'monument',
        value: 1.4,
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
  {
    policyIds: ['policy-guilds', 'policy-free-market'],
    cost: { culture: 420, gold: 80 },
    prerequisites: { requiredBuildings: ['market'] },
  },
  {
    policyIds: ['policy-frontier', 'policy-homeland'],
    cost: { culture: 620, fur: 220 },
    prerequisites: { requiredWorkshopUnlockIds: ['exploration_gear'] },
  },
  {
    policyIds: ['policy-scholasticism', 'policy-festivals'],
    cost: { culture: 7200, gold: 1200 },
    prerequisites: {
      requiredBuildings: ['observatory', 'monument'],
      requiredTickCount: REALTIME_DAY_TICKS * 6,
    },
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
  {
    id: 'animal_husbandry',
    name: '驯养学',
    description: '改善狗舍管理，解锁训练犬舍并提升狗口扩张空间。',
    cost: { science: 120, food: 120 },
    prerequisites: {
      requiredBuildings: ['library'],
    },
    effects: [
      {
        id: 'animal-husbandry-barn-cost',
        type: 'building_cost',
        targetId: 'barn',
        value: 0.9,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'masonry',
    name: '砌石术',
    description: '掌握石材结构，降低仓储建设压力并铺垫采石场。',
    cost: { science: 150, stone: 120 },
    prerequisites: {
      requiredWorkshopUnlockIds: ['wood_pickaxe'],
    },
    effects: [
      {
        id: 'masonry-warehouse-cost',
        type: 'building_cost',
        targetId: 'warehouse',
        value: 0.9,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'forestry',
    name: '林地管理',
    description: '解锁护林员，并提升木材体系的长期产出。',
    cost: { science: 260, wood: 180 },
    prerequisites: {
      requiredTechs: ['woodworking'],
    },
    effects: [
      {
        id: 'forestry-lumberjack-bonus',
        type: 'job_production',
        targetId: 'lumberjack',
        value: 1.25,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'logistics',
    name: '后勤学',
    description: '改进仓储与运输，扩大基础资源上限。',
    cost: { science: 320, culture: 100 },
    prerequisites: {
      requiredBuildings: ['warehouse'],
      requiredTechs: ['administration'],
    },
    effects: [
      {
        id: 'logistics-wood-limit',
        type: 'resource_limit',
        targetId: 'wood',
        value: 1.45,
        mode: 'multiplier',
      },
      {
        id: 'logistics-stone-limit',
        type: 'resource_limit',
        targetId: 'stone',
        value: 1.45,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'education',
    name: '教育制度',
    description: '建立系统教育，解锁学院。',
    cost: { science: 360, culture: 160 },
    prerequisites: {
      requiredTechs: ['administration'],
    },
    effects: [
      {
        id: 'education-scientist-bonus',
        type: 'job_production',
        targetId: 'scientist',
        value: 1.18,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'metalworking',
    name: '金属加工',
    description: '把铁矿转化为工程能力，解锁工程师岗位与铁制工具。',
    cost: { science: 280, iron: 80 },
    prerequisites: {
      requiredTechs: ['mining'],
      requiredBuildings: ['smelter'],
    },
    effects: [
      {
        id: 'metalworking-smelter-output',
        type: 'building_production',
        targetId: 'smelter',
        value: 1.2,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'charcoal_burning',
    name: '烧炭法',
    description: '解锁炭窑，让木材进入煤炭与后期冶炼链。',
    cost: { science: 300, wood: 240, stone: 120 },
    prerequisites: {
      requiredTechs: ['forestry'],
    },
    effects: [],
  },
  {
    id: 'expedition_cartography',
    name: '远征制图',
    description: '把探索记录转化为路线图，解锁后期探矿工具。',
    cost: { science: 420, fur: 180, culture: 160 },
    prerequisites: {
      requiredWorkshopUnlockIds: ['exploration_gear'],
    },
    effects: [
      {
        id: 'expedition-cartography-dogpower-limit',
        type: 'resource_limit',
        targetId: 'dogpower',
        value: 1.5,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'economics',
    name: '经济学',
    description: '建立交换与记账观念，解锁集市。',
    cost: { science: 360, culture: 180, fur: 120 },
    prerequisites: {
      requiredTechs: ['administration'],
    },
    effects: [
      {
        id: 'economics-gold-limit',
        type: 'resource_limit',
        targetId: 'gold',
        value: 1.6,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'astronomy',
    name: '天文学',
    description: '通过观星建立长期科研目标，解锁观星台。',
    cost: { science: 3200, culture: 1200, gold: 320 },
    prerequisites: {
      requiredBuildings: ['academy'],
      requiredTechs: ['calendar'],
      requiredTickCount: REALTIME_DAY_TICKS * 2,
    },
    effects: [
      {
        id: 'astronomy-science-limit',
        type: 'resource_limit',
        targetId: 'science',
        value: 1.45,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'banking',
    name: '银行业',
    description: '规范金属货币流通，解锁铸币所。',
    cost: { science: 2800, culture: 1600, gold: 420 },
    prerequisites: {
      requiredBuildings: ['market'],
      requiredTechs: ['economics', 'metalworking'],
      requiredTickCount: REALTIME_DAY_TICKS * 3,
    },
    effects: [
      {
        id: 'banking-merchant-bonus',
        type: 'job_production',
        targetId: 'merchant',
        value: 1.25,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'civil_service',
    name: '文官制度',
    description: '形成长期治理结构，解锁纪念碑和高阶政策。',
    cost: { science: 3600, culture: 3200, gold: 520 },
    prerequisites: {
      requiredBuildings: ['market', 'academy'],
      requiredTechs: ['education', 'economics'],
      requiredTickCount: REALTIME_DAY_TICKS * 4,
    },
    effects: [
      {
        id: 'civil-service-culture-limit',
        type: 'resource_limit',
        targetId: 'culture',
        value: 1.6,
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
    id: 'hand_saw',
    name: '手锯',
    description: '改良木工工具，提升伐木工与护林员产量。',
    cost: { wood: 160, science: 120 },
    prerequisites: {
      requiredBuildings: ['workshop'],
      requiredTechs: ['woodworking'],
    },
    effects: [
      {
        id: 'hand-saw-lumberjack-output',
        type: 'job_production',
        targetId: 'lumberjack',
        value: 1.25,
        mode: 'multiplier',
      },
      {
        id: 'hand-saw-forester-output',
        type: 'job_production',
        targetId: 'forester',
        value: 1.2,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'irrigation_channels',
    name: '灌溉沟渠',
    description: '把轮作农法落地到农场，提升食物稳定性。',
    cost: { wood: 180, stone: 160, science: 160 },
    prerequisites: {
      requiredBuildings: ['workshop'],
      requiredTechs: ['crop_rotation'],
    },
    effects: [
      {
        id: 'irrigation-farm-output',
        type: 'building_production',
        targetId: 'farm',
        value: 1.3,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'iron_pickaxe',
    name: '铁镐',
    description: '升级矿具，显著提升矿工和探矿犬收益。',
    cost: { wood: 220, stone: 180, iron: 120, science: 220 },
    prerequisites: {
      requiredBuildings: ['workshop'],
      requiredTechs: ['metalworking'],
      requiredWorkshopUnlockIds: ['stone_pickaxe'],
    },
    effects: [
      {
        id: 'iron-pickaxe-miner-output',
        type: 'job_production',
        targetId: 'miner',
        value: 1.45,
        mode: 'multiplier',
      },
      {
        id: 'iron-pickaxe-prospector-output',
        type: 'job_production',
        targetId: 'prospector',
        value: 1.25,
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
  {
    id: 'field_pack',
    name: '野外背包',
    description: '提高探索补给容量，提升猎人汪力产出和毛皮储备。',
    cost: { wood: 180, fur: 120, science: 180 },
    prerequisites: {
      requiredWorkshopUnlockIds: ['exploration_gear'],
    },
    effects: [
      {
        id: 'field-pack-hunter-output',
        type: 'job_production',
        targetId: 'hunter',
        value: 1.3,
        mode: 'multiplier',
      },
      {
        id: 'field-pack-fur-limit',
        type: 'resource_limit',
        targetId: 'fur',
        value: 1.5,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'survey_compass',
    name: '测绘罗盘',
    description: '解锁探矿犬岗位，把远征路线延伸到黄金矿脉。',
    cost: { wood: 1800, iron: 420, gold: 220, science: 1800 },
    prerequisites: {
      requiredTechs: ['expedition_cartography'],
      requiredWorkshopUnlockIds: ['exploration_gear'],
    },
    effects: [],
  },
  {
    id: 'printing_press',
    name: '活字印刷',
    description: '传播知识，提升科学与文化岗位。',
    cost: { wood: 2200, iron: 520, science: 2600, culture: 1400 },
    prerequisites: {
      requiredTechs: ['education'],
      requiredBuildings: ['academy'],
    },
    effects: [
      {
        id: 'printing-press-scientist-output',
        type: 'job_production',
        targetId: 'scientist',
        value: 1.25,
        mode: 'multiplier',
      },
      {
        id: 'printing-press-artist-output',
        type: 'job_production',
        targetId: 'artist',
        value: 1.2,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'ledger',
    name: '复式账本',
    description: '改良交易记录，提升商贩与黄金储备。',
    cost: { wood: 1800, science: 2200, culture: 1600, gold: 320 },
    prerequisites: {
      requiredTechs: ['economics'],
      requiredBuildings: ['market'],
    },
    effects: [
      {
        id: 'ledger-merchant-output',
        type: 'job_production',
        targetId: 'merchant',
        value: 1.3,
        mode: 'multiplier',
      },
      {
        id: 'ledger-gold-limit',
        type: 'resource_limit',
        targetId: 'gold',
        value: 1.45,
        mode: 'multiplier',
      },
    ],
  },
  {
    id: 'steel_tools',
    name: '钢制工具',
    description: '后期通用工具升级，提升采集、工程和冶炼效率。',
    cost: { wood: 5200, stone: 5200, iron: 1200, coal: 900, science: 5200 },
    prerequisites: {
      requiredTechs: ['banking'],
      requiredWorkshopUnlockIds: ['iron_pickaxe'],
      requiredTickCount: REALTIME_DAY_TICKS * 5,
    },
    effects: [
      {
        id: 'steel-tools-forester-output',
        type: 'job_production',
        targetId: 'forester',
        value: 1.35,
        mode: 'multiplier',
      },
      {
        id: 'steel-tools-engineer-output',
        type: 'job_production',
        targetId: 'engineer',
        value: 1.35,
        mode: 'multiplier',
      },
      {
        id: 'steel-tools-smelter-output',
        type: 'building_production',
        targetId: 'smelter',
        value: 1.35,
        mode: 'multiplier',
      },
    ],
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
