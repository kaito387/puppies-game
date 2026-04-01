import { useGameStore } from '@/store/gameStore'
import { RESOURCES } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function ResourcePanel() {
  const gameState = useGameStore((store) => store.gameState)
  const population = Math.floor(gameState.resourceCounts.puppies || 0)
  const growthProgress = Math.floor((gameState.populationGrowthProgress || 0) * 100)
  const populationCap = Math.floor(gameState.resourceLimits.puppies || 0)
  const totalAssigned = Object.values(gameState.jobAssignments).reduce((sum, count) => sum + count, 0)
  const idlePopulation = population - totalAssigned

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📦 资源</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="max-h-[46vh] pr-3">
          <div className="flex flex-col gap-2">
            {RESOURCES.map((resource) => {
              const amount = gameState.resourceCounts[resource.id] || 0
              const limit = gameState.resourceLimits[resource.id] || 0
              return (
                <div key={resource.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm">
                    {resource.icon} {resource.name}
                  </span>
                  <Badge variant="secondary">
                    {amount.toFixed(0)} / {limit.toFixed(0)}
                  </Badge>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">人口 {population}/{populationCap}</Badge>
          <Badge variant="outline">在岗 {totalAssigned}</Badge>
          <Badge variant="outline">空闲 {idlePopulation}</Badge>
          <Badge variant="outline">增长 {growthProgress}%</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
