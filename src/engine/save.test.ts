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

  it('should persist workshop unlocks', () => {
    const state = createInitialGameState()
    state.workshopUnlockIds = ['wood_pickaxe']

    saveGame(state)
    const loaded = loadGame()

    expect(loaded.workshopUnlockIds).toEqual(['wood_pickaxe'])
  })

  it('should filter unknown workshop unlock IDs while loading', () => {
    localStorage.setItem(
      'puppies-game-save',
      JSON.stringify({
        version: '0.0.0',
        workshopUnlockIds: ['wood_pickaxe', 'unknown-unlock'],
      }),
    )

    const loaded = loadGame()
    expect(loaded.workshopUnlockIds).toEqual(['wood_pickaxe'])
  })

  it('should persist and reload buildingActiveCounts correctly', () => {
    const state = createInitialGameState()
    state.buildings.smelter = 2
    state.buildingActiveCounts.smelter = 2
    saveGame(state)

    const loaded = loadGame()
    expect(loaded.buildingActiveCounts.smelter).toBe(2)
  })

  it('should default buildingActiveCounts to initial value when missing from old save', () => {
    const oldSave = {
      version: '0.0.0',
      resourceCounts: { food: 10 },
      buildings: { smelter: 1 },
      tickCount: 5,
      lastTickTime: 12345,
    }
    localStorage.setItem('puppies-game-save', JSON.stringify(oldSave))

    const loaded = loadGame()
    expect(loaded.buildingActiveCounts).toBeDefined()
    expect(loaded.buildingActiveCounts.smelter ?? 0).toBe(0)
  })

  describe('Trade – discoveredAnimalIds compatibility', () => {
    it('should default discoveredAnimalIds to empty array when field is missing from old save', () => {
      localStorage.setItem(
        'puppies-game-save',
        JSON.stringify({
          version: '0.0.0',
          resourceCounts: { food: 10 },
          buildings: {},
          tickCount: 5,
          lastTickTime: 12345,
        }),
      )

      const loaded = loadGame()
      expect(loaded.discoveredAnimalIds).toEqual([])
    })

    it('should persist and reload discoveredAnimalIds correctly', () => {
      const state = createInitialGameState()
      state.discoveredAnimalIds = ['cats']
      saveGame(state)

      const loaded = loadGame()
      expect(loaded.discoveredAnimalIds).toEqual(['cats'])
    })

    it('should persist multiple discovered animals and reload all of them', () => {
      const state = createInitialGameState()
      state.discoveredAnimalIds = ['cats', 'lizards']
      saveGame(state)

      const loaded = loadGame()
      expect(loaded.discoveredAnimalIds).toContain('cats')
      expect(loaded.discoveredAnimalIds).toContain('lizards')
      expect(loaded.discoveredAnimalIds).toHaveLength(2)
    })

    it('should filter unknown animal ids from save data', () => {
      localStorage.setItem(
        'puppies-game-save',
        JSON.stringify({
          version: '0.0.0',
          discoveredAnimalIds: ['cats', 'unknown-animal', 'lizards'],
        }),
      )

      const loaded = loadGame()
      expect(loaded.discoveredAnimalIds).toContain('cats')
      expect(loaded.discoveredAnimalIds).toContain('lizards')
      expect(loaded.discoveredAnimalIds).not.toContain('unknown-animal')
    })

    it('should default discoveredAnimalIds to empty array when value is not an array', () => {
      localStorage.setItem(
        'puppies-game-save',
        JSON.stringify({
          version: '0.0.0',
          discoveredAnimalIds: 'cats',
        }),
      )

      const loaded = loadGame()
      expect(loaded.discoveredAnimalIds).toEqual([])
    })

    it('should handle null discoveredAnimalIds in save data gracefully', () => {
      localStorage.setItem(
        'puppies-game-save',
        JSON.stringify({
          version: '0.0.0',
          discoveredAnimalIds: null,
        }),
      )

      const loaded = loadGame()
      expect(loaded.discoveredAnimalIds).toEqual([])
    })

    it('should not persist animal ids that were removed from TRADES config', () => {
      const state = createInitialGameState()
      state.discoveredAnimalIds = ['cats', 'unknown-animal']
      saveGame(state)

      const rawSave = JSON.parse(localStorage.getItem('puppies-game-save')!)
      expect(rawSave.discoveredAnimalIds).toEqual(['cats'])
      expect(rawSave.discoveredAnimalIds).not.toContain('unknown-animal')
    })

    it('should return empty discoveredAnimalIds on corrupt JSON save', () => {
      localStorage.setItem('puppies-game-save', 'not-valid-json{{{')

      const loaded = loadGame()
      expect(loaded.discoveredAnimalIds).toEqual([])
    })
  })
})