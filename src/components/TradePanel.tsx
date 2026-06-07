import { useGameStore } from '@/store/gameStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

export function TradePanel() {
  const gameState = useGameStore((s) => s.gameState)
  const dispatchTradeExplore = useGameStore((s) => s.dispatchTradeExplore)
  const dispatchTradeExchange = useGameStore((s) => s.dispatchTradeExchange)
  const dispatchUpgradeEmbassy = useGameStore((s) => s.dispatchUpgradeEmbassy)
  const getAvailableTradeAnimals = useGameStore((s) => s.getAvailableTradeAnimals)
  const getEmbassyLevel = useGameStore((s) => s.getEmbassyLevel)
  const getAnimalBuyCosts = useGameStore((s) => s.getAnimalBuyCosts)
  const getAnimalSellAmounts = useGameStore((s) => s.getAnimalSellAmounts)
  const canUpgradeEmbassy = useGameStore((s) => s.canUpgradeEmbassy)

  const dogPower = gameState?.resourceCounts?.dogpower ?? 0
  const animals = getAvailableTradeAnimals()

  const hasEnoughResources = (costs: Record<string, number>) => {
    return Object.entries(costs).every(([res, val]) => {
      return (gameState?.resourceCounts?.[res] ?? 0) >= val
    })
  }

  return (
    <Card className="h-[80vh] flex flex-col p-4">
      <CardHeader className="pb-3 px-2">
        <CardTitle className="flex items-center justify-between">
          <span>贸易</span>
          <div className="flex gap-3 text-sm font-normal">
            <span>DogPower: {dogPower.toFixed(0)}</span>
            <span>已发现: {animals.length}</span>
          </div>
        </CardTitle>
        <CardDescription>探索动物、建立大使馆、进行物资交易</CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1">
        <div className="space-y-6 pb-6 px-2 py-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">野外探索</CardTitle>
              <CardDescription>消耗 1000 DogPower 探索新动物，失败返还 900</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={dispatchTradeExplore}
                disabled={dogPower < 1000}
              >
                探索新动物
              </Button>
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-medium">可交易动物</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {animals.map((animal) => {
                const { id, name, icon } = animal
                const embassyLevel = getEmbassyLevel(id)
                const costs = getAnimalBuyCosts(id)
                const rewards = getAnimalSellAmounts(id)
                const canUpgrade = canUpgradeEmbassy(id)
                const canTrade = hasEnoughResources(costs)

                return (
                  <Card key={id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex justify-between items-center">
                        <span>{icon} {name}</span>
                        <Badge className="bg-green-600">已发现</Badge>
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap text-xs">
                        <Badge variant="outline">大使馆 Lv.{embassyLevel}</Badge>
                        {embassyLevel >= 5 && <Badge variant="secondary">Lv.5</Badge>}
                        {embassyLevel >= 10 && <Badge variant="secondary">Lv.10</Badge>}
                        {embassyLevel >= 15 && <Badge variant="secondary">Lv.15</Badge>}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 text-xs">
                      <div>
                        {Object.entries(costs).map(([res, val]) => (
                          <div key={res} className="text-red-500">
                            消耗: {res} ×{val}
                          </div>
                        ))}
                      </div>

                      <div className="text-green-600">
                        {Object.entries(rewards).map(([res, val]) => (
                          <div key={res}>
                            获得: {res} ×{val}
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground mt-1">
                          实际获得受仓储上限影响
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => dispatchTradeExchange(id)}
                          disabled={!canTrade}
                        >
                          执行交易
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canUpgrade}
                          onClick={() => dispatchUpgradeEmbassy(id)}
                        >
                          升级大使馆
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  )
}