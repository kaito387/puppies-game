import { useEffect, useRef } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { useGameStore } from '@/store/gameStore'
import { ResourcePanel } from '@/components/ResourcePanel'
import { BuildingPanel } from '@/components/BuildingPanel'
import { DogManagementPanel } from '@/components/DogManagementPanel'
import { TechnologyPanel } from '@/components/TechnologyPanel'
import { WorkshopPanel } from '@/components/WorkshopPanel'
import { LogPanel } from '@/components/LogPanel'
import { SettingsPanel } from '@/components/SettingsPanel'
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
import { Calendar } from '@/components/ui/calendar'
import { PolicyPanel } from '@/components/PolicyPanel'
import { TradePanel } from '@/components/TradePanel'

function PlaceholderActionPanel(props: {
  title: string
  description: string
  buttonLabel: string
  requirement?: string
  locked?: boolean
}) {
  const { title, description, buttonLabel, requirement, locked = true } = props

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button disabled={locked}>{buttonLabel}</Button>
        {requirement ? (
          <span className="text-sm text-muted-foreground">前置条件: {requirement}</span>
        ) : null}
      </CardContent>
    </Card>
  )
}

function App() {
  const tick = useGameStore((store) => store.tick)
  const saveGame = useGameStore((store) => store.saveGame)
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
              <Calendar />
              <span>TPS: ~5</span>
              <LogPanel />
              <SettingsPanel />
            </div>
          </div>
        </header>
        <div className="px-4 py-4">
          <Tabs defaultValue="buildings" className="gap-4">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="buildings">建筑</TabsTrigger>
              <TabsTrigger value="management">管理</TabsTrigger>
              <TabsTrigger value="technologies">科技</TabsTrigger>
              <TabsTrigger value="workshop">工坊</TabsTrigger>
              <TabsTrigger value="trade">贸易</TabsTrigger>
              <TabsTrigger value="policies">政策</TabsTrigger>
            </TabsList>
            <TabsContent value="buildings">
              <BuildingPanel />
            </TabsContent>
            <TabsContent value="management">
              <DogManagementPanel />
            </TabsContent>
            <TabsContent value="technologies">
              <TechnologyPanel />
            </TabsContent>
            <TabsContent value="workshop">
              <WorkshopPanel />
            </TabsContent>
            <TabsContent value="trade">
              <TradePanel />
            </TabsContent>
            <TabsContent value="policies">
              <PolicyPanel />
            </TabsContent>
          </Tabs>

          <Card className="mt-4">
            <CardContent className="pt-6 text-xs text-muted-foreground">
              💾 游戏会自动保存到浏览器存储。
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      <Toaster richColors position="top-center" />
    </SidebarProvider>
  )
}

export default App
