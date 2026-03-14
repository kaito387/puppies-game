import { describe, it, expect, beforeEach } from 'vitest';
import { tick, calculateProduction } from './gameLoop';
import { type GameState, createInitialGameState } from './types';

describe('Game Loop', () => {
    let gameState: GameState;

    beforeEach(() => {
        gameState = createInitialGameState();
    });

    describe('Production', () => {
        it('should calculate production correctly with no buildings', () => {
            const production = calculateProduction(gameState);
            expect(production).toEqual({ puppies: 0, food: 0, bones: 0 });
        });

        it('should calculate production correctly with multiple buildings', () => {
            gameState.buildings.barn = 2;
            gameState.buildings.farm = 3;
            const production = calculateProduction(gameState);
            expect(production.puppies).toBeCloseTo(0.04);
            expect(production.food).toBeCloseTo(0.6);
            expect(production.bones).toBe(0);
        });
    });
    
    describe('Tick', () => {
        it('should produce resources on tick', () => {
            gameState.buildings.barn = 1;
            gameState.buildings.farm = 1;
            const newState = tick(gameState);
            expect(newState.resourceCounts.puppies).toBeCloseTo(0.02);
            expect(newState.resourceCounts.food).toBeCloseTo(0.2);
            expect(newState.tickCount).toBe(1);
        });

        it('should not exceed resource limits on tick', () => {
            gameState.buildings.barn = 300;
            const newState = tick(gameState);
            expect(newState.resourceCounts.puppies).toBe(5); // TODO 修改
        });
    });

});
