import { useMemo, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PencilIcon } from 'lucide-react'
import { JOBS, type Dog } from '@/engine/types'
import { isDogNameValid, sanitizeDogName } from '@/engine/dogs'

const FILTER_ALL = 'all'
const FILTER_IDLE = 'idle'
const DOGS_PER_PAGE = 6

type DogFilter = typeof FILTER_ALL | typeof FILTER_IDLE | string

function getExperienceText(dog: Dog): string {
  if (dog.currentJobId) {
    return (dog.experienceByJob[dog.currentJobId] || 0).toFixed(1)
  }

  const totalExperience = Object.values(dog.experienceByJob).reduce((sum, value) => sum + value, 0)
  return totalExperience.toFixed(1)
}

function DogCard(props: {
  dog: Dog
  availableJobs: typeof JOBS
  onRename: (dogId: string, nextName: string) => void
  onAssignJob: (dogId: string, jobId: string | null) => void
}) {
  const { dog, availableJobs, onRename, onAssignJob } = props
  const [draftName, setDraftName] = useState(dog.name)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)

  const currentJob = dog.currentJobId ? JOBS.find((job) => job.id === dog.currentJobId) : null
  const talentJob = JOBS.find((job) => job.id === dog.talentJobId)

  const openRenameDialog = () => {
    setDraftName(dog.name)
    setNameError(null)
    setIsRenameDialogOpen(true)
  }

  const handleRename = () => {
    const normalizedName = sanitizeDogName(draftName)
    if (!isDogNameValid(normalizedName)) {
      setNameError('名字长度必须在 1-16 个字符')
      return
    }

    setNameError(null)
    onRename(dog.id, normalizedName)
    setIsRenameDialogOpen(false)
  }

  return (
    <Card className="border-dashed">
      <CardContent className="space-y-3 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{dog.name}</h3>
              <Button variant="ghost" size="icon-xs" onClick={openRenameDialog} aria-label={`修改 ${dog.name} 的名字`}>
                <PencilIcon />
              </Button>
              <Badge variant={dog.status === 'working' ? 'default' : 'secondary'}>
                {dog.status === 'working' ? '工作中' : '空闲'}
              </Badge>
              <Badge variant="outline">年龄 {dog.age}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">当前经验 {getExperienceText(dog)}</Badge>
              <Badge variant="outline">天赋 {talentJob ? talentJob.name : '未知'}</Badge>
              <Badge variant="outline">当前工作 {currentJob ? currentJob.name : '无'}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onAssignJob(dog.id, null)} disabled={dog.currentJobId === null}>
              设为空闲
            </Button>
            {availableJobs.map((job) => (
              <Button
                key={job.id}
                variant={dog.currentJobId === job.id ? 'default' : 'outline'}
                size="xs"
                onClick={() => onAssignJob(dog.id, job.id)}
              >
                {job.name}
              </Button>
            ))}
          </div>
        </div>

        <Dialog
          open={isRenameDialogOpen}
          onOpenChange={(open) => {
            setIsRenameDialogOpen(open)
            if (open) {
              setDraftName(dog.name)
              setNameError(null)
            } else {
              setNameError(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>修改名字</DialogTitle>
              <DialogDescription>给这只狗重新起一个更好记的名字。</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Input
                value={draftName}
                onChange={(event) => {
                  setDraftName(event.target.value)
                  if (nameError) {
                    setNameError(null)
                  }
                }}
                placeholder="输入狗狗名字"
                maxLength={16}
                autoFocus
                aria-label={`修改 ${dog.name} 的名字`}
              />
              {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleRename}>保存名字</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export function DogManagementPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const getVisibleJobIds = useGameStore((store) => store.getVisibleJobIds)
  const renameDog = useGameStore((store) => store.renameDog)
  const assignDogJob = useGameStore((store) => store.assignDogJob)
  const visibleJobIds = getVisibleJobIds()
  const [filter, setFilter] = useState<DogFilter>(FILTER_ALL)
  const [currentPage, setCurrentPage] = useState(1)

  const availableJobs = useMemo(
    () => JOBS.filter((job) => visibleJobIds.includes(job.id)),
    [visibleJobIds],
  )

  const effectiveFilter =
    filter !== FILTER_ALL &&
    filter !== FILTER_IDLE &&
    !availableJobs.some((job) => job.id === filter)
      ? FILTER_ALL
      : filter

  const filteredDogs = gameState.dogs.filter((dog) => {
    if (effectiveFilter === FILTER_ALL) {
      return true
    }

    if (effectiveFilter === FILTER_IDLE) {
      return dog.currentJobId === null
    }

    return dog.currentJobId === effectiveFilter
  })

  const totalPages = Math.max(1, Math.ceil(filteredDogs.length / DOGS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const visibleDogs = filteredDogs.slice((safeCurrentPage - 1) * DOGS_PER_PAGE, safeCurrentPage * DOGS_PER_PAGE)

  const handleFilterChange = (nextFilter: DogFilter) => {
    setFilter(nextFilter)
    setCurrentPage(1)
  }

  const idleCount = gameState.dogs.filter((dog) => dog.currentJobId === null).length
  const workingCount = gameState.dogs.length - idleCount

  return (
    <Card>
      <CardHeader>
        <CardTitle>🐕 狗狗管理</CardTitle>
        <CardDescription>查看每只狗的属性，手动改名，或者直接分配工作。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">总数 {gameState.dogs.length}</Badge>
          <Badge variant="outline">空闲 {idleCount}</Badge>
          <Badge variant="outline">在岗 {workingCount}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={effectiveFilter === FILTER_ALL ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange(FILTER_ALL)}>
            全部
          </Button>
          <Button variant={effectiveFilter === FILTER_IDLE ? 'default' : 'outline'} size="sm" onClick={() => handleFilterChange(FILTER_IDLE)}>
            空闲
          </Button>
          {availableJobs.map((job) => (
            <Button
              key={job.id}
              variant={effectiveFilter === job.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(job.id)}
            >
              {job.name}
            </Button>
          ))}
        </div>

        <Separator />

        {filteredDogs.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            当前筛选下没有狗狗
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                第 {safeCurrentPage} / {totalPages} 页，每页 {DOGS_PER_PAGE} 只
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage <= 1}>
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>

            <ScrollArea className="max-h-[58vh] pr-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleDogs.map((dog) => (
                  <DogCard
                    key={dog.id}
                    dog={dog}
                    availableJobs={availableJobs}
                    onRename={renameDog}
                    onAssignJob={assignDogJob}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
