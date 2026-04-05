import { useGameStore } from '@/store/gameStore'
import { TECHNOLOGIES } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function TechnologyPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const getVisibleTechnologiesIds = useGameStore((store) => store.getVisibleTechnologiesIds)
  const visibleTechnologiesIds = getVisibleTechnologiesIds()
  // should define a new variable to avoid calling the function in the render loop and 
  // causing zustand to think the state has changed and re-rendering infinitely
  const canResearch = useGameStore((store) => store.canResearchTechnology)
  const researchTechnology = useGameStore((store) => store.researchTechnology)

  if (visibleTechnologiesIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔬 科学</CardTitle>
          <CardDescription>当前暂无可见科技。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔬 科学研究</CardTitle>
        <CardDescription>研发科技可以解锁新岗位、建筑与数值增益。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">科学点 {Math.floor(gameState.resourceCounts.science || 0)}</Badge>
          <Badge variant="outline">已研究 {gameState.researchedTechIds.length}</Badge>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          {visibleTechnologiesIds.map((techId) => {
            const technology = TECHNOLOGIES.find((t) => t.id === techId)
            if (!technology) return null

            const researched = gameState.researchedTechIds.includes(technology.id)
            const researchable = canResearch(technology.id)
            const costText = Object.entries(technology.cost)
              .map(([resourceId, amount]) => `${amount} ${resourceId}`)
              .join(' + ')

            return (
              <div key={technology.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <div className="font-medium">{technology.name}</div>
                  <div className="text-sm text-muted-foreground">{technology.description}</div>
                  <div className="text-xs text-muted-foreground">花费: {costText}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={researched || !researchable}
                    onClick={() => researchTechnology(technology.id)}
                  >
                    {researched ? '已研究' : '研究'}
                  </Button>
                  {researched && <Badge variant="outline">完成</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
