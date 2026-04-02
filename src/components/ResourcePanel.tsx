import { useGameStore } from '@/store/gameStore'
import { GAME_TICK_INTERVAL_MS } from '@/engine/constants'
import { RESOURCES } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

export function ResourcePanel() {
  const gameState = useGameStore((store) => store.gameState)
  const setDomesticateEnabled = useGameStore((store) => store.setDomesticateEnabled)
  const ratePerSecondMultiplier = 1000 / GAME_TICK_INTERVAL_MS
  const population = Math.floor(gameState.population || 0)
  const growthProgressRaw = gameState.populationGrowthProgress || 0
  const growthProgressPercent = Math.floor(Math.abs(growthProgressRaw) * 100)
  const populationCap = Math.floor(gameState.populationCap || 0)
  const totalAssigned = Object.values(gameState.jobAssignments).reduce((sum, count) => sum + count, 0)
  const idlePopulation = Math.max(0, population - totalAssigned)
  const shouldShowProgress = growthProgressPercent > 0
  const progressText = growthProgressRaw > 0 ? `+${growthProgressPercent}%` : `-${growthProgressPercent}%`

  const formatRateText = (ratePerSecond: number): string => {
    const absoluteRate = Math.abs(ratePerSecond)

    if (absoluteRate < 10) {
      return ratePerSecond.toFixed(2)
    }

    if (absoluteRate < 100) {
      return ratePerSecond.toFixed(1)
    }

    return ratePerSecond.toFixed(0)
  }

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
              const deltaPerTick = gameState.resourceDeltaPerTick[resource.id] || 0
              const ratePerSecond = deltaPerTick * ratePerSecondMultiplier
              const shouldShowRate = Math.abs(ratePerSecond) > 0.0001
              return (
                <div key={resource.id} className="flex items-center justify-between rounded-md border px-3 py-2 gap-3">
                  <span className="text-sm">
                    {resource.icon} {resource.name}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <Badge variant="secondary">
                      {amount.toFixed(0)} / {limit.toFixed(0)}
                    </Badge>
                    {shouldShowRate && (
                      <Badge
                        variant="outline"
                        className={
                          ratePerSecond > 0
                            ? 'border-green-500/30 bg-green-500/10 text-green-700'
                            : 'border-red-500/30 bg-red-500/10 text-red-700'
                        }
                      >
                        {ratePerSecond > 0 ? '+' : ''}{formatRateText(ratePerSecond)}/s
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm">允许入驻</span>
            <span className="text-xs text-muted-foreground">
              开启后会消耗食物驯服新小狗
            </span>
          </div>
          <Switch size="lg"
            checked={gameState.isDomesticateEnabled}
            onCheckedChange={setDomesticateEnabled}
            aria-label="切换是否允许小狗入驻"
          />
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">
            狗口 {population}
            {shouldShowProgress && (
              <>
                (
                <span className={growthProgressRaw > 0 ? 'text-green-600' : 'text-red-600'}>{progressText}</span>
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
