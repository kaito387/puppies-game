import { BUILDINGS, RESOURCES, type GameState } from "./types";
import { min } from "./utils";

export function calculateProduction(gameState: GameState): Record<string, number> {
    const production: Record<string, number> = {};

    RESOURCES.forEach(resource => {
        production[resource.id] = 0;
    });

    BUILDINGS.forEach(building => {
        const count = gameState.buildings[building.id] || 0;
        for (const [resourceId, amount] of Object.entries(building.productionPerTick)) {
            production[resourceId] += amount * count;
        }
    });

    return production;
}

export function tick(state: GameState): GameState {
    const production = calculateProduction(state);

    const newResourceCounts: Record<string, number> = { ...state.resourceCounts };
    for (const [resourceId, amount] of Object.entries(production)) {
        newResourceCounts[resourceId] = min((newResourceCounts[resourceId] || 0) + amount, state.resourceLimits[resourceId] || 0);
    }

    return {
        ...state,
        resourceCounts: newResourceCounts,
        tickCount: state.tickCount + 1,
        lastTickTime: Date.now(),
    };
}