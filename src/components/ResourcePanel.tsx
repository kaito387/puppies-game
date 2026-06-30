import { useGameStore } from '@/store/gameStore'
import { GAME_TICK_INTERVAL_MS } from '@/engine/constants'
import { calculateResourceLimits } from '@/engine/gameLoop'
import { RESOURCES } from '@/engine/types'
import { getAssignedCount, getPopulationCount } from '@/engine/dogs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { formatAmount } from '@/engine/formatters'

export function ResourcePanel() {
  const gameState = useGameStore((store) => store.gameState)
  const resourceDeltaPerTick = useGameStore((store) => store.resourceDeltaPerTick)
  const setDomesticateEnabled = useGameStore((store) => store.setDomesticateEnabled)
  const resourceLimits = calculateResourceLimits(gameState)
  const ratePerSecondMultiplier = 1000 / GAME_TICK_INTERVAL_MS
  const population = getPopulationCount(gameState.dogs)
  const growthProgressRaw = gameState.populationGrowthProgress || 0
  const growthProgressPercent = Math.floor(Math.abs(growthProgressRaw) * 100)
  const populationCap = Math.floor(gameState.populationCap || 0)
  const totalAssigned = getAssignedCount(gameState.dogs)
  const idlePopulation = Math.max(0, population - totalAssigned)
  const shouldShowProgress = growthProgressPercent > 0
  const progressText =
    growthProgressRaw > 0 ? `+${growthProgressPercent}%` : `-${growthProgressPercent}%`

  const formatRateText = (ratePerSecond: number): string => {
    const absoluteRate = Math.abs(ratePerSecond)

    return formatAmount(absoluteRate < 100 ? ratePerSecond : Math.round(ratePerSecond))
  }

  return (
    <Card className="min-h-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">资源总览</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-3">
        <ScrollArea className="h-[min(42vh,24rem)] min-h-0 overflow-hidden pr-3">
          <div className="flex flex-col gap-2">
            {RESOURCES.map((resource) => {
              const amount = gameState.resourceCounts[resource.id] || 0
              const limit = resourceLimits[resource.id] || 0
              const deltaPerTick = resourceDeltaPerTick[resource.id] || 0
              const ratePerSecond = deltaPerTick * ratePerSecondMultiplier
              const shouldShowRate = Math.abs(ratePerSecond) > 0.0001
              return (
                <div
                  key={resource.id}
                  className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm">
                    {resource.icon} {resource.name}
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Badge variant="secondary">
                      {formatAmount(amount)} / {formatAmount(limit)}
                    </Badge>
                    {shouldShowRate && (
                      <Badge variant={ratePerSecond > 0 ? 'default' : 'destructive'}>
                        {ratePerSecond > 0 ? '+' : ''}
                        {formatRateText(ratePerSecond)}/s
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <Separator className="shrink-0" />

        <div className="shrink-0 flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm">允许入驻</span>
            <span className="text-xs text-muted-foreground">开启后会消耗食物驯服新小狗</span>
          </div>
          <Switch
            size="lg"
            checked={gameState.isDomesticateEnabled}
            onCheckedChange={setDomesticateEnabled}
            aria-label="切换是否允许小狗入驻"
          />
        </div>

        <Separator className="shrink-0" />

        <div className="flex shrink-0 flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">
            狗口 {population}
            {shouldShowProgress && (
              <>
                (
                <span className={growthProgressRaw > 0 ? 'text-foreground' : 'text-destructive'}>
                  {progressText}
                </span>
                )
              </>
            )}
            /{populationCap}
          </Badge>
          <Badge variant="outline">在岗 {totalAssigned}</Badge>
          <Badge variant="outline">空闲 {idlePopulation}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
