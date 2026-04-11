import { beforeEach, describe, expect, it } from 'vitest'
import { loadGame, resetGame, saveGame } from '@/engine/save'
import { createInitialGameState } from '@/engine/initialState'
import { createDogs } from '@/engine/dogs'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('Save System', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    })
    resetGame()
  })

  it('should default missing population fields from old saves', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        resourceCounts: { food: 10, wood: 1 },
        resourceLimits: { food: 100, wood: 100 },
        buildings: { barn: 1, farm: 0, warehouse: 0 },
        jobAssignments: { farmer: 1, hunter: 0 },
        tickCount: 10,
        lastTickTime: 12345,
      }),
    )

    const loaded = loadGame()
    expect(loaded.dogs).toEqual([])
    expect(loaded.populationCap).toBe(1)
    expect(loaded.isDomesticateEnabled).toBe(false)
    expect(loaded.populationGrowthProgress).toBe(0)
  })

  it('should load old saves without resource delta fields', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        resourceCounts: { food: 10, wood: 1 },
        resourceLimits: { food: 100, wood: 100 },
        buildings: { barn: 1, farm: 0, warehouse: 0 },
        jobAssignments: { farmer: 1, hunter: 0 },
        tickCount: 10,
        lastTickTime: 12345,
      }),
    )

    const loaded = loadGame()
    expect(loaded.resourceCounts.food).toBe(10)
    expect(loaded.resourceCounts.wood).toBe(1)
  })

  it('should preserve population/domestication related fields', () => {
    const state = createInitialGameState()
    state.dogs = createDogs(3)
    state.populationCap = 7
    state.isDomesticateEnabled = true
    state.populationGrowthProgress = -0.55
    saveGame(state)
    const loaded = loadGame()

    expect(loaded.dogs).toHaveLength(3)
    expect(loaded.populationCap).toBe(7)
    expect(loaded.isDomesticateEnabled).toBe(true)
    expect(loaded.populationGrowthProgress).toBeCloseTo(-0.55)
  })

  it('should persist researched technologies', () => {
    const state = createInitialGameState()
    state.researchedTechIds = ['woodworking']

    saveGame(state)
    const loaded = loadGame()

    expect(loaded.researchedTechIds).toEqual(['woodworking'])
  })

  it('should filter unknown researched technologies while loading', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        researchedTechIds: ['woodworking', 'unknown-tech'],
      }),
    )

    const loaded = loadGame()
    expect(loaded.researchedTechIds).toEqual(['woodworking'])
  })
})
