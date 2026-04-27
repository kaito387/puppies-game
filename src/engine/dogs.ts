import {
  JOBS,
  type Dog,
  type DogStatus,
} from '@/engine/types'
import {
  DOG_EXPERIENCE_GAIN_FOR_TALENT_MULTIPLIER,
  DOG_EXPERIENCE_GAIN_PER_TICK,
  DOG_EXPERIENCE_OUTPUT_BONUS_CAP,
  DOG_EXPERIENCE_OUTPUT_BONUS_COEFFICIENT,
  DOG_EXPERIENCE_OUTPUT_BONUS_CONSTANT,
} from '@/engine/constants'

const DOG_NAME_PREFIX = [
  '阿',
  '小',
  '豆',
  '毛',
  '栗',
  '松',
  '奶',
  '团',
]

const DOG_NAME_SUFFIX = [
  '福',
  '豆',
  '球',
  '宝',
  '旺',
  '卷',
  '星',
  '仔',
]

const DEFAULT_MAX_NAME_LENGTH = 16

function getRandomDogColor(): string {
    const colors = [
        '#F59E0B', '#10B981', '#3B82F6', '#EC4899',
        '#8B5CF6', '#EF4444', '#14B8A6', '#F97316'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function createRandomDogName(): string {
  const prefix = pickRandom(DOG_NAME_PREFIX)
  const suffix = pickRandom(DOG_NAME_SUFFIX)
  return `${prefix}${suffix}`
}

function getRandomTalentJobId(): string {
  return pickRandom(JOBS).id
}

function createJobExperience(): Record<string, number> {
  const result: Record<string, number> = {}
  JOBS.forEach((job) => {
    result[job.id] = 0
  })
  return result
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
    age: 0,
    experienceByJob: createJobExperience(),
    talentJobId: getRandomTalentJobId(),
    status: 'idle',
    currentJobId: null,
    color: getRandomDogColor(),
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

export function calculateDogExperienceGain(dog: Dog, jobId: string): number {
  const talentMultiplier = dog.talentJobId === jobId ? DOG_EXPERIENCE_GAIN_FOR_TALENT_MULTIPLIER : 1
  return DOG_EXPERIENCE_GAIN_PER_TICK * talentMultiplier
}
