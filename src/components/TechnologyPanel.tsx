import { useGameStore } from '@/store/gameStore'
import { TECHNOLOGIES } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { describeEffect, formatResourceList } from '@/engine/formatters'
import { CheckIcon, FlaskConicalIcon } from 'lucide-react'

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
          <CardTitle>科学研究</CardTitle>
          <CardDescription>建造图书馆后会出现第一批可研究科技。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>科学研究</CardTitle>
        <CardDescription>研发科技可以解锁新岗位、建筑与数值增益。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">
            科学点 {Math.floor(gameState.resourceCounts.science || 0)}
          </Badge>
          <Badge variant="outline">已研究 {gameState.researchedTechIds.length}</Badge>
        </div>

        <Separator />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleTechnologiesIds.map((techId) => {
            const technology = TECHNOLOGIES.find((t) => t.id === techId)
            if (!technology) return null

            const researched = gameState.researchedTechIds.includes(technology.id)
            const researchable = canResearch(technology.id)
            const costText = formatResourceList(technology.cost)

            return (
              <div
                key={technology.id}
                className="flex min-h-44 flex-col justify-between gap-3 rounded-md border bg-card p-3"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium leading-none">{technology.name}</div>
                    {researched ? <Badge variant="default">完成</Badge> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">{technology.description}</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">花费 {costText}</Badge>
                    {technology.effects?.map((effect) => (
                      <Badge key={effect.id} variant="outline">
                        {describeEffect(effect)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={researched || !researchable}
                    onClick={() => researchTechnology(technology.id)}
                  >
                    {researched ? (
                      <CheckIcon data-icon="inline-start" />
                    ) : (
                      <FlaskConicalIcon data-icon="inline-start" />
                    )}
                    {researched ? '已研究' : '研究'}
                  </Button>
                  {!researched && !researchable ? <Badge variant="outline">资源不足</Badge> : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
