# Repository Guidelines

## Project Structure & Module Organization
- App entry: `index.tsx` boots `App.tsx` with Vite + React + TS.
- UI and features:
  - `components/` (UI, forms, layout, icons)
  - `pages/` (route-level screens)
  - `ui/` (UI providers, settings)
  - `hooks/`, `utils/`, `types.ts`, `constants.ts`
  - `i18n/` (translations, provider)
  - `services/` (Supabase, CSV parser, Gemini API)
- Config: `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `.env.local`.
- Import alias: use `@/` for project-root imports (see `tsconfig.json`).

## Build, Test, and Development Commands
- `npm run dev` – start Vite dev server.
- `npm run build` – production build to `dist/`.
- `npm run preview` – preview the production build locally.

## Environment & AI Setup
- Create `.env.local` with `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` as needed. Vite exposes these as `process.env.*` (see `vite.config.ts`).
- AI flow lives in `components/AIAssist.tsx` and `services/geminiService.ts`.

## Coding Style & Naming Conventions
- Language: TypeScript + React (functional components, hooks-first).
- Indentation: 2 spaces; avoid trailing whitespace; keep imports sorted (third‑party → internal `@/`).
- Files:
  - Components/pages: PascalCase `*.tsx` (e.g., `components/layout/Sidebar.tsx`).
  - Utilities/services/hooks: lower camel/kebab as appropriate (e.g., `utils/format.ts`, `services/supabaseService.ts`, `hooks/useData.ts`).
- CSS: Tailwind in JSX `className`. Prefer semantic grouping and reuse via small components.

## Testing Guidelines
- No formal test runner is configured yet. If adding tests:
  - Prefer Vitest + React Testing Library.
  - Name tests `*.test.ts`/`*.test.tsx`, colocated with source or under `__tests__/`.
  - Mock network (Supabase/GenAI) and provide fixtures for CSV parsing.

## Architecture Overview
- Data hub: `hooks/useData.ts` centralizes accounts, transactions, installments; exposes CRUD and recalculates balances.
- Services: `services/supabaseService.ts` (mock DB with artificial delays), `services/geminiService.ts` (Gemini analysis), plus CSV parsing.
- Installments: derived from transactions with `installmentMonths > 1`; completed plans filtered out.
- AI import: upload → Gemini structured parse → user confirm/edit → batch import via `addMultipleTransactions`.

## Commit & Pull Request Guidelines
- Use Conventional Commits (found in history):
  - Examples: `feat(transactions): ...`, `fix(settings): ...`, `docs(changelog): ...`, `style(density): ...`.
  - Imperative, present tense; concise subject; scope in parentheses.
- PRs should include:
  - Summary, rationale, and screenshots/GIFs for UI changes.
  - Linked issues (`Closes #123`).
  - Test/verification steps and any i18n key updates.

## Security & Configuration Tips
- Secrets live in `.env.local` (e.g., Supabase keys, GenAI keys). Do not commit.
- Avoid committing large sample datasets; keep temporary artifacts in `temp/` when necessary.
- Validate types: prefer strict typings in services and props; surface errors to UI gracefully.

## Agent-Specific Instructions
- Language: respond in Korean for this project’s interactions.
- 항상 터미널에는 한글로 대답한다.
- Command protocol: before running shell/git/build actions, briefly explain purpose and ask for confirmation; use extra caution for destructive ops.
- Critical analysis first: do not accept proposals blindly; evaluate alternatives, risks, and best practices.
- Feedback and plan confirmation: before any action, share feedback and a brief plan and obtain explicit confirmation.
- 사용자의 제안을 무조건 수용하지 말고 비판적으로 검토·개선안을 제시하고, 실행 전 피드백과 계획서를 확인받는다.
- Git hygiene: keep Conventional Commits; prefer small PRs with clear descriptions and screenshots for UI.
