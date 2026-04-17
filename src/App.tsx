import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ResourcePanel } from '@/components/ResourcePanel'
import { BuildingPanel } from '@/components/BuildingPanel'
import { JobPanel } from '@/components/JobPanel'
import { TechnologyPanel } from '@/components/TechnologyPanel'
import { AUTO_SAVE_INTERVAL_TICKS, GAME_TICK_INTERVAL_MS } from '@/engine/constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function PlaceholderActionPanel(props: {
  title: string
  description: string
  buttonLabel: string
  requirement: string
}) {
  const { title, description, buttonLabel, requirement } = props

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button disabled>{buttonLabel}</Button>
        <span className="text-sm text-muted-foreground">前置条件: {requirement}</span>
      </CardContent>
    </Card>
  )
}

function App() {
  const tick = useGameStore((store) => store.tick)
  const gameState = useGameStore((store) => store.gameState)
  const saveGame = useGameStore((store) => store.saveGame)
  const resetGame = useGameStore((store) => store.resetGame)
  const gameTickRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      tick()
      gameTickRef.current += 1

      if (gameTickRef.current % AUTO_SAVE_INTERVAL_TICKS === 0) {
        saveGame()
      }
    }, GAME_TICK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [tick, saveGame])

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/40 p-3">
            <h1 className="text-xl font-semibold">🐕 狗国建设者</h1>
            <p className="text-xs text-muted-foreground">资源总览</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <ResourcePanel />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold">狗狗帝国控制台</h2>
                <p className="text-sm text-muted-foreground">建造、分工与扩张都在这里进行。</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Ticks: {gameState.tickCount}</span>
              <span>TPS: ~5</span>
              <Button variant="outline" onClick={resetGame} className="w-[90%] mx-auto">
                🔄 重置游戏
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 py-4">
          <Tabs defaultValue="buildings" className="gap-4">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="buildings">建筑</TabsTrigger>
              <TabsTrigger value="jobs">工作</TabsTrigger>
              <TabsTrigger value="technologies">科技</TabsTrigger>
              <TabsTrigger value="exploration">探索</TabsTrigger>
              <TabsTrigger value="trade">贸易</TabsTrigger>
            </TabsList>

            <TabsContent value="buildings">
              <BuildingPanel />
            </TabsContent>
            <TabsContent value="jobs">
              <JobPanel />
            </TabsContent>
            <TabsContent value="technologies">
              <TechnologyPanel />
            </TabsContent>
            <TabsContent value="exploration">
              <PlaceholderActionPanel
                title="🧭 探索"
                description="派出队伍探索附近区域，寻找新资源。"
                buttonLabel="派出探索队"
                requirement="需要 3 空闲人口"
              />
            </TabsContent>
            <TabsContent value="trade">
              <PlaceholderActionPanel
                title="💱 贸易"
                description="与邻近部落交换物资，稳定补给。"
                buttonLabel="发起贸易"
                requirement="需要 20 骨头库存"
              />
            </TabsContent>
          </Tabs>

          <Card className="mt-4">
            <CardContent className="pt-6 text-xs text-muted-foreground">💾 游戏会自动保存到浏览器存储。</CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
