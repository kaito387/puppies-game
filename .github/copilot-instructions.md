# Project Guidelines

## Code Style
- Use TypeScript with strict typing and keep engine logic framework-agnostic.
- Follow existing formatting/linting setup: ESLint + Prettier.
- Keep React components in `src/components/` focused on presentation and user interactions; do not embed core simulation logic there.
- Prefer extending existing patterns in `src/engine/types.ts`, `src/engine/actions.ts`, `src/engine/gameLoop.ts`, and `src/store/gameStore.ts` before introducing new abstractions.

## Architecture
- Maintain the Engine/Store/UI split:
- `src/engine/`: pure game-domain logic (state transitions, production, save/load helpers).
- `src/store/`: Zustand orchestration layer that invokes engine functions and exposes actions/selectors to UI.
- `src/components/` and `src/App.tsx`: React rendering and event wiring.
- Core game state schema is defined in `src/engine/types.ts`; state transitions should be immutable and return new `GameState` objects.

## Build and Test
- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Format: `npm run format`
- Unit/integration tests (watch): `npm run test`
- CI-style tests (single run): `npm run test:run`
- Coverage: `npm run test:coverage`
- Production build: `npm run build`
- Preview build: `npm run preview`

## Conventions
- Keep tick-related behavior consistent with constants in `src/engine/constants.ts` (`GAME_TICK_INTERVAL_MS`, `AUTO_SAVE_INTERVAL_TICKS`).
- Resource updates should always respect limits (see `min(...)` usage in `src/engine/actions.ts` and `src/engine/gameLoop.ts`).
- New tests for engine logic should live beside source files in `src/engine/*.test.ts` and use fresh state from `createInitialGameState()` per test.
- For numeric production assertions, prefer tolerant checks (`toBeCloseTo`) when floating-point math is involved.
- Prefer guarding invalid user actions in UI (disable controls) while keeping engine invariants validated.

## Documentation Links
- Contribution workflow and PR expectations: `CONTRIBUTING.md`
- Team onboarding and daily workflow: `docs/TEAM_HANDBOOK.md`
- Requirements background: `docs/01_需求分析报告.md`
- System modeling and diagrams: `docs/02_系统建模报告.md`
- Engineering process and CI/CD notes: `docs/04_软件工程化实践文档.md`
