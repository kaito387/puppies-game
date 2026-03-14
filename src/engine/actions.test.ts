import { describe, it, expect, beforeEach } from "vitest";
import { buildBuilding, clickResource } from "./actions";
import { type GameState, createInitialGameState } from "./types";

describe("Actions", () => {
    let gameState: GameState;

    beforeEach(() => {
        gameState = createInitialGameState();
    });

    describe('Building', () => {
        it('should build a barn if resources are sufficient', () => {
            gameState.resourceCounts.bones = 10;
            const newState = buildBuilding(gameState, 'barn');
            expect(newState.buildings.barn).toBe(1);
            expect(newState.resourceCounts.bones).toBe(0);
        });

        it('should not build a barn if resources are insufficient', () => {
            gameState.resourceCounts.bones = 5;
            expect(() => buildBuilding(gameState, 'barn')).toThrow('资源 bones 不足');
        });

        it('should throw an error if building does not exist', () => {
            expect(() => buildBuilding(gameState, 'nonexistent')).toThrow('建筑 nonexistent 不存在');
        });
    });

    describe('Clicking Resources', () => {
        it('should increase resource count when clicking', () => {
            const newState = clickResource(gameState, 'bones', 3);
            expect(newState.resourceCounts.bones).toBe(3);
        });

        it('should default to increasing by 1 if amount is not specified', () => {
            const newState = clickResource(gameState, 'bones');
            expect(newState.resourceCounts.bones).toBe(1);
        });

        it('should not exceed resource limits when clicking', () => {
            gameState.resourceLimits.bones = 5;
            const newState = clickResource(gameState, 'bones', 10);
            expect(newState.resourceCounts.bones).toBe(5);
        });
    });

});