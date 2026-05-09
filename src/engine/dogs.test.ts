import { describe, it, expect } from 'vitest'
import {
  createDog,
  createDogs,
  calculateDogOutputMultiplier,
  calculateDogExperienceGain,
  getJobAssignment,
  getPopulationCount,
  getIdleDogs,
  getAssignedCount,
  normalizeDogStatus,
  sanitizeDogName,
  isDogNameValid,
} from '@/engine/dogs'
import { 
  DOG_EXPERIENCE_GAIN_PER_TICK,
  DOG_EXPERIENCE_OUTPUT_BONUS_CAP,
} from '@/engine/constants'

describe('dogs', () => {
  describe('createDog', () => {
    it('should create a dog with all required properties', () => {
      const dog = createDog()
      expect(dog).toHaveProperty('id')
      expect(dog).toHaveProperty('name')
      expect(dog).toHaveProperty('color')
      expect(dog).toHaveProperty('age')
      expect(dog).toHaveProperty('experienceByJob')
      expect(dog).toHaveProperty('traitId')
      expect(dog).toHaveProperty('status')
      expect(dog).toHaveProperty('currentJobId')
    })

    it('should create a dog with idle status', () => {
      const dog = createDog()
      expect(dog.status).toBe('idle')
      expect(dog.currentJobId).toBeNull()
    })

    it('should create a dog with age between 12 and 29', () => {
      const dog = createDog()
      expect(dog.age).toBeGreaterThanOrEqual(12)
      expect(dog.age).toBeLessThanOrEqual(29)
    })
  })

  describe('createDogs', () => {
    it('should create specified number of dogs', () => {
      const dogs = createDogs(5)
      expect(dogs).toHaveLength(5)
    })

    it('should create empty array when count is 0', () => {
      const dogs = createDogs(0)
      expect(dogs).toHaveLength(0)
    })

    it('should create unique dogs', () => {
      const dogs = createDogs(3)
      const ids = dogs.map(dog => dog.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3)
    })
  })

  describe('calculateDogOutputMultiplier', () => {
    it('should return a number for existing job experience', () => {
      const dog = createDog()
      dog.experienceByJob['farmer'] = 10
      const multiplier = calculateDogOutputMultiplier(dog, 'farmer')
      expect(typeof multiplier).toBe('number')
    })

    it('should handle zero experience', () => {
      const dog = createDog()
      dog.experienceByJob['farmer'] = 0
      const multiplier = calculateDogOutputMultiplier(dog, 'farmer')
      expect(multiplier).toBeDefined()
    })

    it('should cap bonus at DOG_EXPERIENCE_OUTPUT_BONUS_CAP', () => {
      const dog = createDog()
      dog.experienceByJob['farmer'] = 999999
      const multiplier = calculateDogOutputMultiplier(dog, 'farmer')
      expect(multiplier).toBeLessThanOrEqual(DOG_EXPERIENCE_OUTPUT_BONUS_CAP)
    })

    it('should handle missing job experience', () => {
      const dog = createDog()
      const multiplier = calculateDogOutputMultiplier(dog, 'nonexistent')
      expect(typeof multiplier).toBe('number')
    })
  })

  describe('calculateDogExperienceGain', () => {
    it('should return base gain when trait does not match job', () => {
      const dog = createDog()
      dog.traitId = 'farmer'
      const gain = calculateDogExperienceGain()
      expect(gain).toBe(DOG_EXPERIENCE_GAIN_PER_TICK)
    })
  })

  describe('normalizeDogStatus', () => {
    it('should return working when jobId is provided', () => {
      expect(normalizeDogStatus('farmer')).toBe('working')
    })

    it('should return idle when jobId is null', () => {
      expect(normalizeDogStatus(null)).toBe('idle')
    })
  })

  describe('getPopulationCount', () => {
    it('should return correct dog count', () => {
      const dogs = createDogs(10)
      expect(getPopulationCount(dogs)).toBe(10)
    })

    it('should return 0 for empty array', () => {
      expect(getPopulationCount([])).toBe(0)
    })
  })

  describe('getIdleDogs', () => {
    it('should return dogs with no job assignment', () => {
      const dogs = createDogs(5)
      dogs[0].currentJobId = 'farmer'
      dogs[1].currentJobId = null
      dogs[2].currentJobId = 'lumberjack'
      dogs[3].currentJobId = null
      dogs[4].currentJobId = null
      
      const idle = getIdleDogs(dogs)
      expect(idle).toHaveLength(3)
      idle.forEach(dog => {
        expect(dog.currentJobId).toBeNull()
      })
    })

    it('should return empty array when all dogs are assigned', () => {
      const dogs = createDogs(3)
      dogs.forEach(dog => { dog.currentJobId = 'farmer' })
      
      const idle = getIdleDogs(dogs)
      expect(idle).toHaveLength(0)
    })
  })

  describe('getAssignedCount', () => {
    it('should count dogs with jobs', () => {
      const dogs = createDogs(5)
      dogs[0].currentJobId = 'farmer'
      dogs[1].currentJobId = 'lumberjack'
      dogs[2].currentJobId = null
      dogs[3].currentJobId = 'miner'
      dogs[4].currentJobId = null
      
      expect(getAssignedCount(dogs)).toBe(3)
    })

    it('should return 0 when no dogs have jobs', () => {
      const dogs = createDogs(5)
      dogs.forEach(dog => { dog.currentJobId = null })
      expect(getAssignedCount(dogs)).toBe(0)
    })
  })

  describe('getJobAssignment', () => {
    it('should count dogs assigned to specific job', () => {
      const dogs = createDogs(5)
      dogs[0].currentJobId = 'farmer'
      dogs[1].currentJobId = 'farmer'
      dogs[2].currentJobId = 'lumberjack'
      dogs[3].currentJobId = 'farmer'
      dogs[4].currentJobId = null
      
      expect(getJobAssignment(dogs, 'farmer')).toBe(3)
      expect(getJobAssignment(dogs, 'lumberjack')).toBe(1)
      expect(getJobAssignment(dogs, 'miner')).toBe(0)
    })
  })

  describe('sanitizeDogName', () => {
    it('should trim whitespace from name', () => {
      expect(sanitizeDogName('  Buddy  ')).toBe('Buddy')
      expect(sanitizeDogName('\tMax\n')).toBe('Max')
      expect(sanitizeDogName('   Charlie   ')).toBe('Charlie')
    })

    it('should return empty string for empty input', () => {
      expect(sanitizeDogName('')).toBe('')
      expect(sanitizeDogName('   ')).toBe('')
    })
  })

  describe('isDogNameValid', () => {
    it('should accept names between 1 and 20 characters', () => {
      expect(isDogNameValid('A')).toBe(true)
      expect(isDogNameValid('Valid Dog Name')).toBe(true)
      expect(isDogNameValid('A'.repeat(20))).toBe(true)
    })

    it('should reject empty or whitespace-only names', () => {
      expect(isDogNameValid('')).toBe(false)
      expect(isDogNameValid('   ')).toBe(false)
      expect(isDogNameValid('\t\n')).toBe(false)
    })

    it('should reject names longer than 20 characters', () => {
      const longName = 'A'.repeat(21)
      expect(isDogNameValid(longName)).toBe(false)
    })

    it('should trim before validation', () => {
      expect(isDogNameValid('  Valid  ')).toBe(true)
      expect(isDogNameValid('  '.repeat(11))).toBe(false)
    })
  })
})