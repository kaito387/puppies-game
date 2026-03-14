export interface Resource {
    id: string;
    name: string;
    icon?: string;  // TODO Optional
}
// TODO 资源可以区分浮点数和整数

export interface Building {
    id: string;
    name: string;
    icon?: string;  // TODO Optional
    description: string;
    cost: Record<string, number>;
    productionPerTick: Record<string, number>;
}

export interface GameState {
    resourceCounts: Record<string, number>;
    resourceLimits: Record<string, number>;
    buildings: Record<string, number>;

    tickCount: number;
    lastTickTime: number;
}

export const RESOURCES: Resource[] = [
    { id: 'puppies', name: '小狗', icon: '🐕' },
    { id: 'food', name: '食物', icon: '🍖' },
    { id: 'bones', name: '骨头', icon: '🦴' },
];

export const RESOURCE_LIMITS: Record<string, number> = {
    puppies: 5,
    food: 5000,
    bones: 5000,
};

export const BUILDINGS: Building[] = [
    {
        id: 'barn',
        name: '狗舍',
        icon: '🏠',
        description: '可以容纳 2 只小狗，每 10 秒生产 1 只小狗',
        cost: { bones: 10 },
        productionPerTick: { puppies: 0.02 },
    },
    {
        id: 'farm',
        name: '农场',
        icon: '🌾',
        description: '每秒生产 1 份食物',
        cost: { bones: 20 },
        productionPerTick: { food: 0.2 },
    }
];

export function createInitialResourceLimits(): Record<string, number> {
    const limits: Record<string, number> = structuredClone(RESOURCE_LIMITS);
    return limits;
}

export function createInitialGameState(): GameState {
    const resources: Record<string, number> = {};
    RESOURCES.forEach(resource => {
        resources[resource.id] = 0;
    });

    const buildings: Record<string, number> = {};
    BUILDINGS.forEach(building => {
        buildings[building.id] = 0;
    });

    return {
        resourceCounts: resources,
        resourceLimits: createInitialResourceLimits(),
        buildings,
        tickCount: 0,
        lastTickTime: Date.now(),
    };
}