import { JOBS, type Dog, type DogStatus } from '@/engine/types'
import {
  DOG_EXPERIENCE_OUTPUT_BONUS_CAP,
  DOG_EXPERIENCE_OUTPUT_BONUS_COEFFICIENT,
  DOG_EXPERIENCE_OUTPUT_BONUS_CONSTANT,
} from '@/engine/constants'

const DOG_NAME_PREFIX = [
  'Angel',
  'Charlie',
  'Mittens',
  'Oreo',
  'Lily',
  'Ellie',
  'Amber',
  'Molly',
  'Jasper',
  'Oscar',
  'Theo',
  'Maddie',
  'Cassie',
  'Timber',
  'Meeko',
  'Micha',
  'Tami',
  'Plato',
  'Bea',
  'Cedar',
  'Cleo',
  'Dali',
  'Fiona',
  'Hazel',
  'Iggi',
  'Jasmine',
  'Kali',
  'Luna',
  'Reilly',
  'Reo',
  'Rikka',
  'Ruby',
  'Tammy'
]

const DOG_NAME_SUFFIX = [
  'Smoke', 
  'Dust', 
  'Chalk', 
  'Fur', 
  'Clay', 
  'Paws', 
  'Tails', 
  'Sand', 
  'Scratch', 
  'Berry', 
  'Shadow',
  'Ash', 
  'Bark', 
  'Bowl', 
  'Brass', 
  'Dusk', 
  'Gaze', 
  'Gleam', 
  'Grass', 
  'Moss', 
  'Plaid', 
  'Puff', 
  'Rain',
  'Silk', 
  'Silver', 
  'Speck', 
  'Stripes', 
  'Tingle', 
  'Wool', 
  'Yarn'
]

const DEFAULT_MAX_NAME_LENGTH = 20

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function createRandomDogName(): string {
  const prefix = pickRandom(DOG_NAME_PREFIX)
  const suffix = pickRandom(DOG_NAME_SUFFIX)
  return `${prefix}${suffix}`
}

function getRandomTraitId(): string {
  return pickRandom(TRAITS).id
}

function createJobExperience(): Record<string, number> {
  const result: Record<string, number> = {}
  JOBS.forEach((job) => {
    result[job.id] = 0
  })
  return result
}

const randomColors: Record<string, string> = {
  gray: 'rgb(128, 128, 128)',
  green: 'rgb(55, 126, 34)',
  cyan: 'rgb(75, 166, 158)',
  blue: 'rgb(0, 0, 245)',
  yellow: 'rgb(240, 148, 54)',
  red: 'rgb(234, 51, 34)',
  black: 'rgb(0, 0, 0)',
}

function createRandomColor(): string {
  const weight = Math.random()
  if (weight < 0.5) {
    return randomColors.gray
  } else if (weight < 0.75) {
    return randomColors.green
  } else if (weight < 0.88) {
    return randomColors.cyan
  } else if (weight < 0.94) {
    return randomColors.blue
  } else if (weight < 0.97) {
    return randomColors.yellow
  } else if (weight < 0.99) {
    return randomColors.red
  } else {
    return randomColors.black
  }
}

function createRandomAge(): number {
  return Math.floor(Math.random() * 18) + 12
}

export function sanitizeDogName(name: string): string {
  return name.trim()
}

export function isDogNameValid(name: string): boolean {
  const sanitized = sanitizeDogName(name)
  return sanitized.length >= 1 && sanitized.length <= DEFAULT_MAX_NAME_LENGTH
}

export function createDog(): Dog {
  return {
    id: crypto.randomUUID(),
    name: createRandomDogName(),
    color: createRandomColor(),
    age: createRandomAge(),
    experienceByJob: createJobExperience(),
    traitId: getRandomTraitId(),
    status: 'idle',
    currentJobId: null,
  }
}

export function createDogs(count: number): Dog[] {
  const dogs: Dog[] = []

  for (let i = 0; i < count; i += 1) {
    dogs.push(createDog())
  }

  return dogs
}

export function normalizeDogStatus(currentJobId: string | null): DogStatus {
  return currentJobId ? 'working' : 'idle'
}

export function getPopulationCount(dogs: Dog[]): number {
  return dogs.length
}

export function getIdleDogs(dogs: Dog[]): Dog[] {
  return dogs.filter((dog) => dog.currentJobId === null)
}

export function getAssignedCount(dogs: Dog[]): number {
  return dogs.length - getIdleDogs(dogs).length
}

export function getJobAssignment(dogs: Dog[], jobId: string): number {
  return dogs.filter((dog) => dog.currentJobId === jobId).length
}

export function calculateDogOutputMultiplier(dog: Dog, jobId: string): number {
  const experience = dog.experienceByJob[jobId] || 0
  const bonus = Math.min(DOG_EXPERIENCE_OUTPUT_BONUS_CAP, Math.log(experience + 1) * DOG_EXPERIENCE_OUTPUT_BONUS_COEFFICIENT + DOG_EXPERIENCE_OUTPUT_BONUS_CONSTANT)
  return bonus
}

export function getLeaderDog(dogs: Dog[], leaderDogId: string | null): Dog | null {
  if (!leaderDogId) {
    return null
  }
  return dogs.find((dog) => dog.id === leaderDogId) || null
}

export function getLeaderTrait(dogs: Dog[], leaderDogId: string | null): Trait | null {
  const leaderDog = getLeaderDog(dogs, leaderDogId)
  if (!leaderDog) {
    return null
  }

  const trait = TRAITS.find((item) => item.id === leaderDog.traitId)
  if (!trait) {
    return null
  }

  return trait
}
