import { useGameStore } from '@/store/gameStore'
import { BUILDINGS } from '@/engine/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatResourceList } from '@/engine/formatters'
import { MinusIcon, PlusIcon, WheatIcon } from 'lucide-react'

export function BuildingPanel() {
  const gameState = useGameStore((store) => store.gameState)
  const getUnlockedBuildingIds = useGameStore((store) => store.getUnlockedBuildingIds)
  const unlockedBuildingIds = getUnlockedBuildingIds()
  const buildBuilding = useGameStore((store) => store.buildBuilding)
  const clickResource = useGameStore((store) => store.clickResource)
  const getBuildingCost = useGameStore((store) => store.getBuildingCost)
  const canBuildBuilding = useGameStore((store) => store.canBuildBuilding)

  const setBuildingActiveCount = useGameStore((store) => store.setBuildingActiveCount)

  const handleDelta = (buildingId: string, delta: number) => {
    const current = gameState.buildingActiveCounts[buildingId] ?? 0
    setBuildingActiveCount(buildingId, current + delta)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>小镇建设</CardTitle>
        <CardDescription>建造基础设施，扩展产能、容量与玩法分支。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
          <Button size="sm" onClick={() => clickResource('food', 2)}>
            <WheatIcon data-icon="inline-start" />
            采集食物
          </Button>
          <span className="text-xs text-muted-foreground">
            开局过渡用；稳定发展仍需要农场和岗位。
          </span>
        </div>

        <Separator />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {BUILDINGS.filter((building) => unlockedBuildingIds.includes(building.id)).map(
            (building) => {
              const count = gameState.buildings[building.id] || 0
              const buildingCost = getBuildingCost(building.id)
              const canBuild = canBuildBuilding(building.id)

              const activeCount = gameState.buildingActiveCounts[building.id] || 0
              const isToggleable = building.isToggleable

              const costText = formatResourceList(buildingCost)
              const productionText = formatResourceList(building.productionPerTick || {})
              const consumptionText = formatResourceList(building.consumptionPerTick || {})

              return (
                <div
                  key={building.id}
                  className="flex min-h-48 flex-col justify-between gap-3 rounded-md border bg-card p-3"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium leading-none">
                        {building.icon} {building.name}
                      </div>
                      <Badge variant="outline">已有 {count}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{building.description}</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">花费 {costText}</Badge>
                      {building.productionPerTick ? (
                        <Badge variant="outline">产出 {productionText}/tick</Badge>
                      ) : null}
                      {building.consumptionPerTick ? (
                        <Badge variant="outline">消耗 {consumptionText}/tick</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => buildBuilding(building.id)}
                      disabled={!canBuild}
                    >
                      <PlusIcon data-icon="inline-start" />
                      建造
                    </Button>
                    {isToggleable ? <Badge variant="outline">启用 {activeCount}</Badge> : null}
                  </div>
                  {isToggleable && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeCount <= 0}
                        onClick={() => handleDelta(building.id, -10)}
                      >
                        <MinusIcon data-icon="inline-start" />
                        10
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeCount <= 0}
                        onClick={() => handleDelta(building.id, -1)}
                      >
                        <MinusIcon data-icon="inline-start" />1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeCount >= count}
                        onClick={() => handleDelta(building.id, 1)}
                      >
                        <PlusIcon data-icon="inline-start" />1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={activeCount >= count}
                        onClick={() => handleDelta(building.id, 10)}
                      >
                        <PlusIcon data-icon="inline-start" />
                        10
                      </Button>
                    </div>
                  )}
                </div>
              )
            },
          )}
        </div>
      </CardContent>
    </Card>
  )
}
