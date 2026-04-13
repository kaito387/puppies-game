# 贡献指南

感谢你对 Puppies-Game 项目的贡献！本文档会指导你如何有效地参与项目开发。

## 开发工作流

### 1. 环境准备

```bash
git clone https://github.com/kaito387/puppies-game.git
cd puppies-game
npm install
npm run dev  # 启动开发服务器
```

### 2. 创建功能分支

```bash
# 从 develop 分支创建新分支
git checkout develop
git pull origin develop
git checkout -b feat/<your-feature-name>
```

分支命名规范 (conventional commits):

- `feat/xxx` - 新功能
- `fix/xxx` - 修复 bug
- `docs/xxx` - 文档更新
- `test/xxx` - 测试改进
- `refactor/xxx` - 代码重构

### 3. 开发和提交

```bash
# 编写代码...

# 定期提交 (小步骤)
git add <file>
git commit -m "feat: add xxx functionality"

# 保持与 develop 同步
git fetch origin
git rebase origin/develop
```

### 4. 本地测试

提交 PR 前，必须通过以下检查:

```bash
# 代码质量检查
npm run lint

# 运行所有测试
npm run test:run

# 构建检查
npm run build
```

如果有失败，修复后重新运行。

### 5. 推送并创建 PR

```bash
git push origin feat/<your-feature-name>
```

在 GitHub 上创建 Pull Request:

- **标题**: 清晰描述改动 (e.g., "Add resource panel UI component")
- **描述**:
  - 做了什么?
  - 为什么做?
  - 如何测试?
  - 相关的 issue (如果有)

### 6. 代码审查

- 等待至少 1 名团队成员的审查
- 根据反馈进行修改
- 推送更新 (`git push origin feat/your-feature-name`)
- 审查通过后，等待合并到 develop

## 代码规范

### TypeScript/JavaScript

✅ **DO:**

```typescript
// 使用有意义的变量名
const resourceProductionPerTick = calculateProduction(buildings, technologies)

// 使用类型注解 (TypeScript)
function addResource(resourceId: string, amount: number): void {
  // ...
}

// 使用常量而不是魔法数字
const GAME_TICK_INTERVAL_MS = 200
setInterval(gameLoop, GAME_TICK_INTERVAL_MS)
```

❌ **DON'T:**

```typescript
// 不清晰的变量名
const rp = calcProd(b, t)

// 不必要的过度注释
const name = 'Alice' // 设置名字为 Alice
```

### React 组件

```typescript
// ✅ 好的做法：使用 Zustand 获取状态，组件只负责展示
export function ResourcePanel(): JSX.Element {
  const resources = useStore((state) => state.resources);

  return (
    <div className="resource-panel">
      {Object.entries(resources).map(([id, amount]) => (
        <ResourceDisplay key={id} id={id} amount={amount} />
      ))}
    </div>
  );
}

// ❌ 坏的做法
export const ResourcePanel = () => {
  // 不要在组件内直接修改状态
  state.resources = new_resources;

  return <div>{/* ... */}</div>;
};
```

### 测试

```typescript
// ✅ 清晰的测试
describe('calculateResourceProduction', () => {
  it('should calculate base production correctly', () => {
    const buildings = { barn: 5 }
    const techs = { barns_efficiency: 0 }

    const result = calculateResourceProduction(buildings, techs)

    expect(result).toBe(5 * BASE_BARN_PRODUCTION)
  })

  it('should apply technology bonus', () => {
    const buildings = { barn: 1 }
    const techs = { barns_efficiency: 1 }

    const result = calculateResourceProduction(buildings, techs)

    expect(result).toBeGreaterThan(BASE_BARN_PRODUCTION)
  })
})

// ❌ 不清晰的测试
it('works', () => {
  expect(calculateResourceProduction({}, {})).toBeDefined()
})
```

## 测试要求

### 单元测试 (Engine 逻辑)

- **文件**: `src/engine/xxx.test.ts`
- **工具**: Vitest

```bash
npm run test -- src/engine/resources.test.ts
```

### 集成测试 (React 组件)

- **文件**: `src/components/XxxPanel.test.tsx`
- **工具**: Vitest + React Testing Library

```bash
npm run test -- src/components/ResourcePanel.test.tsx
```

### 测试覆盖率报告

```bash
npm run test:coverage
```

## Engine 和 UI 的分离原则

### ✅ Engine 逻辑 (src/engine/)

- 纯 TypeScript，**不允许导入 React**
- 易于单元测试

### ❌ 禁止 (Engine 中)

```typescript
// ❌ 错误 - 不能导入 React
import React from 'react'

// ❌ 错误 - 不能使用 useState
const [state, setState] = useState({})

// ❌ 错误 - 不能调用 React hooks
useEffect(() => {
  /* ... */
}, [])
```

### ✅ UI 层 (src/components/)

- React 组件，管理展示逻辑
- 只读游戏状态 (通过 store)
- 不直接修改 engine 逻辑

```typescript
// ✅ 好的 - UI 组件
export function ResourcePanel(): JSX.Element {
  const resources = useStore((state) => state.resources);

  return (
    <div>
      {resources.food > 0 && <span>Food: {resources.food}</span>}
    </div>
  );
}
```

## 构建和部署

### 生产构建

```bash
npm run build    # 输出到 dist/
npm run preview  # 预览构建结果
```

### 持续集成 (CI)

任何到 develop/main 分支的 PR 都会自动运行:

1. ESLint 检查
2. 单元测试
3. 覆盖率检查
4. 构建检查

所有检查必须通过才能合并。

## 文档

### 代码注释

- 为**复杂逻辑**添加注释
- 为**非明显的设计决策**添加注释
- 不要为**明显的代码**添加注释

### 模块文档

在每个模块的顶部添加简要说明:

```typescript
/**
 * Resource Management System
 *
 * 负责计算资源生产/消耗，处理资源上限等逻辑。
 * 不涉及 UI 展示 (由 components 负责)。
 */

export function calculateProduction(...) { /* ... */ }
```

## 目录结构

```
puppies-game/
├── src/
│   ├── engine/        # 游戏核心逻辑
│   ├── store/         # Zustand 状态管理
│   ├── components/    # React UI 组件
│   └── App.tsx # 主入口，渲染游戏
├── .github/
│   └── workflows/     # GitHub Actions CI/CD
└── docs/              # 项目文档
```

## 问题报告

如果发现 bug，请在 GitHub Issues 上报告:

**标题**: 清晰描述问题

```
Building construction button not working on mobile
```

**描述**:

- 现象: 点击"建造"按钮无反应
- 复现步骤:
  1. 打开游戏
  2. 点击"建造牧场"按钮
  3. 没有反应
- 预期: 显示建造确认对话框
- 实际: 无任何反应
- 环境: Chrome 浏览器, iPhone 12

## 代码审查清单

审查他人的 PR 时，检查:

- [ ] Commit 信息是否清晰?
- [ ] 功能是否符合需求?
- [ ] 代码是否易读? 变量名清晰吗?
- [ ] 是否有新增测试?
- [ ] 是否有不必要的文件或更改被提交?
