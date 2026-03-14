# 项目协作手册

## 🚀 第一天到第一周

### 第一天: 环境准备
```bash
# 1. 克隆项目
git clone https://github.com/<org>/puppies-game.git
cd puppies-game

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器 → http://localhost:5173
```

### 第一周: 了解项目
- [ ] 阅读 README.md
- [ ] 看一遍 src/ 目录结构
- [ ] 尝试修改一个组件，看改动实时反映
- [ ] 运行一次 `npm run test` 看看测试是什么样
- [ ] 在周会上提出问题

## 📋 日常工作流

### 我的任务是什么?
1. 打开 GitHub Projects 看板 (会分配任务)
2. 一共有三个状态: Todo → In Progress → Done
3. 开始工作时，把条目移到 "In Progress"

### 开发一个功能的标准流程
```bash
# 1. 更新代码到最新
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feat/my-awesome-feature

# 3. 开发代码...

# 4. 运行本地检查
npm run lint      # 检查代码风格
npm run format    # 自动格式化
npm run test:run  # 运行所有测试
npm run build     # 检查能否构建

# 5. 推送代码
git push origin feat/my-awesome-feature

# 6. 在 GitHub 网页上创建 Pull Request
#    - 标题: 清晰描述做了什么
#    - 描述: 为什么做、如何测试

# 7. 等待代码审查 → 修改反馈 → 合并
```

## 🔧 常用命令速查

```bash
npm run dev             # 启动开发 → localhost:5173
npm run test            # 运行测试 (watch 模式)
npm run test:run        # 单次运行测试 (CI)
npm run test:coverage   # 生成测试覆盖率报告
npm run lint            # ESLint 检查
npm run format          # Prettier 格式化
npm run build           # 构建生产版本 → dist/
npm run preview         # 预览生产构建
```

## 📚 代码结构速查

| 目录 | 用途 |
|-----|------|
| `src/engine/` | 游戏核心逻辑 (纯 TypeScript, 无 React) |
| `src/store/` | Zustand 状态管理 |
| `src/components/` | React UI 组件 |
| `.github/workflows/` | GitHub Actions CI/CD |

## ❌ 常见错误

### 错误 1: "I can't push to main"
✅ 正确: 创建功能分支，通过 PR 合并
```bash
git checkout -b feat/my-feature    # ✅ 这样做
git push origin feat/my-feature
# 然后创建 PR
```

### 错误 2: "Tests are failing"
1. 读一下错误信息，可能是明显的 bug
2. 在本地运行 `npm run test -- <test-file>` 看详细信息
3. 如果不懂，问 Leader 或 QA

### 错误 3: "Merge conflict"
当两个人改了同一个文件:
```bash
# 打开文件，找到冲突标记 <<<<<<, ======, >>>>>>
# 手动选择保留哪个改动
# 提交解决
git add .
git commit -m "fix: resolve merge conflict"
```

## 💡 Best Practices

### ✅ DO
- 编写代码前 `git pull` 获取最新代码
- 小步骤 commit (不要一次改 1000 行)
- 为代码审查做准备 (确保测试通过)

### ❌ DON'T
- 不要直接 push 到 main (必须 PR)
- 不要忽视 linting 错误
- 不要写没有测试的代码
- 不要 force push (很容易搞坏历史)