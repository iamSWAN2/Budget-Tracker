# Repository Guidelines

## Project Structure & Module Organization
- App entry: `index.tsx` → `App.tsx` (Vite + React + TS).
- Source: `components/`, `pages/`, `ui/`, `hooks/`, `utils/`, `i18n/`, `services/`, `types.ts`, `constants.ts`.
- Config: `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `.env.local`.
- Import alias: `@/` 기준 프로젝트 루트(참고: `tsconfig.json`).
- Data/AI: `hooks/useData.ts`, `services/supabaseService.ts`, `services/geminiService.ts`, CSV parser.

## Build, Test, and Development Commands
- `npm install` – 의존성 설치.
- `npm run dev` – Vite 개발 서버 시작.
- `npm run build` – 프로덕션 빌드(`dist/` 출력).
- `npm run preview` – 로컬에서 빌드 미리보기.
- 환경 변수: `.env.local`에 `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` 설정.

## Coding Style & Naming Conventions
- TypeScript + React 함수형 컴포넌트, hooks-first.
- 들여쓰기 2 spaces, 불필요한 공백 금지, import 정렬(서드파티 → `@/`).
- 파일명: 컴포넌트/페이지는 PascalCase `*.tsx`; 유틸/서비스/훅은 camel/kebab (`utils/format.ts`, `services/supabaseService.ts`, `hooks/useData.ts`).
- 스타일: Tailwind 클래스는 `className`에 선언, 작은 재사용 컴포넌트 선호.

## Testing Guidelines
- 현재 공식 러너 없음. 추가 시 Vitest + RTL 권장.
- 네이밍: `*.test.ts`/`*.test.tsx`, 소스 인접 또는 `__tests__/`.
- 네트워크 모듈(Supabase/GenAI)은 모킹, CSV는 픽스처 제공.
- 스크립트 예: `npm run test` → `vitest --run`.

## Architecture Overview
- 데이터 허브: `hooks/useData.ts`에서 CRUD 및 잔액 재계산.
- 서비스: Supabase(모의 DB, 지연 포함), Gemini 분석, CSV 파싱.
- 할부: `installmentMonths > 1`에서 파생, 완료 계획 제외.
- AI 가져오기: 업로드 → Gemini 구조화 → 확인/수정 → `addMultipleTransactions`.

## Commit & Pull Request Guidelines
- Conventional Commits 사용: `feat(transactions): ...`, `fix(settings): ...`, `docs(changelog): ...`, `style(density): ...`.
- PR: 요약과 근거, UI 변경은 스크린샷/GIF, 연관 이슈(`Closes #123`), 검증 단계, i18n 키 변경 포함.

## Security & Configuration Tips
- 비밀은 `.env.local`에만 보관, 커밋 금지.
- 대용량 샘플 데이터는 지양, 임시 산출물은 `temp/`.
- 타입 엄격화, 오류는 UI에 친절히 노출.
 
## Agent-Specific Instructions
- 사용자가 영어로 프롬프트를 입력해도 한글로 대답한다.
