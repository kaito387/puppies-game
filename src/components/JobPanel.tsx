import { useGameStore } from '@/store/gameStore'
import { JOBS } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function JobPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const setJobAssignment = useGameStore((store) => store.setJobAssignment)

  const population = Math.floor(gameState.resourceCounts.puppies || 0)
  const totalAssigned = Object.values(gameState.jobAssignments).reduce((sum, count) => sum + count, 0)
  const idlePopulation = Math.max(0, population - totalAssigned)

  function setWithDelta(jobId: string, currentAssigned: number, delta: number) {
    if (delta > 0) {
      const allowedIncrease = Math.min(delta, idlePopulation)
      const target = currentAssigned + allowedIncrease
      setJobAssignment(jobId, target)
      return
    }

    const target = Math.max(0, currentAssigned + delta)
    setJobAssignment(jobId, target)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>👷 职业分配</CardTitle>
        <CardDescription>工作人数不能超过总人口，使用快捷按钮可快速调整。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">总人口 {population}</Badge>
          <Badge variant="outline">空闲 {idlePopulation}</Badge>
          <Badge variant="outline">在岗 {totalAssigned}</Badge>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          {JOBS.map((job) => {
            // TODO move this logic to store
            const assigned = gameState.jobAssignments[job.id] || 0
            const canIncrease = idlePopulation > 0
            const canDecrease = assigned > 0
            const canIncreaseTen = idlePopulation > 0
            const canDecreaseTen = assigned > 0

            return (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="font-medium">
                    {job.icon} {job.name}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={!canDecreaseTen} onClick={() => setWithDelta(job.id, assigned, -10)}>
                    -10
                  </Button>
                  <Button variant="outline" size="sm" disabled={!canDecrease} onClick={() => setWithDelta(job.id, assigned, -1)}>
                    -1
                  </Button>
                  <Badge>{assigned}</Badge>
                  <Button variant="outline" size="sm" disabled={!canIncrease} onClick={() => setWithDelta(job.id, assigned, 1)}>
                    +1
                  </Button>
                  <Button variant="outline" size="sm" disabled={!canIncreaseTen} onClick={() => setWithDelta(job.id, assigned, 10)}>
                    +10
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
