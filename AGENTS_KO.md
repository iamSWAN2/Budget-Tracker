# 저장소 가이드라인

## 프로젝트 구조 및 모듈 구성
- 앱 엔트리: `index.tsx`가 Vite + React + TS로 `App.tsx`를 부팅합니다.
- UI/기능:
  - `components/` (UI, 폼, 레이아웃, 아이콘)
  - `pages/` (라우트 단위 화면)
  - `ui/` (UI 프로바이더, 설정)
  - `hooks/`, `utils/`, `types.ts`, `constants.ts`
  - `i18n/` (번역, 프로바이더)
  - `services/` (Supabase, CSV 파서, Gemini API)
- 설정: `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `.env.local`.
- 임포트 별칭: 프로젝트 루트 기준 `@/` 사용 (`tsconfig.json` 참조).

## 빌드·테스트·개발 명령
- `npm run dev` – Vite 개발 서버 실행.
- `npm run build` – 프로덕션 빌드 결과를 `dist/`에 생성.
- `npm run preview` – 빌드본 로컬 프리뷰.

## 환경 및 AI 설정
- `.env.local`에 `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 설정합니다. Vite가 `process.env.*`로 노출합니다(`vite.config.ts` 참고).
- AI 흐름: `components/AIAssist.tsx`, `services/geminiService.ts`에서 동작합니다.

## 코딩 스타일 및 네이밍
- 언어: TypeScript + React(함수형 컴포넌트, hooks 우선).
- 들여쓰기 2칸, 트레일링 공백 금지, 임포트 정렬(서드파티 → 내부 `@/`).
- 파일:
  - 컴포넌트/페이지: PascalCase `*.tsx` (예: `components/layout/Sidebar.tsx`).
  - 유틸/서비스/훅: 소문자 카멜/케밥 적절 사용 (예: `utils/format.ts`, `services/supabaseService.ts`, `hooks/useData.ts`).
- CSS: JSX `className`에서 Tailwind 사용. 작은 컴포넌트로 의미 단위 재사용.

## 테스트 가이드
- 현재 공식 테스트 러너 없음. 도입 시 권장:
  - Vitest + React Testing Library.
  - 테스트 이름 `*.test.ts`/`*.test.tsx`, 소스와 동거 또는 `__tests__/`.
  - 네트워크(Supabase/GenAI) 모킹, CSV 파싱 픽스처 제공.

## 아키텍처 개요
- 데이터 허브: `hooks/useData.ts`가 계좌/거래/할부를 중앙에서 관리하고 CRUD 및 잔액 재계산을 제공합니다.
- 서비스 계층: `services/supabaseService.ts`(모의 DB, 인위적 지연), `services/geminiService.ts`(Gemini 분석), CSV 파서.
- 할부 로직: `installmentMonths > 1` 거래에서 파생되며 완료된 계획은 필터링됩니다.
- AI 가져오기: 업로드 → Gemini 구조화 파싱 → 사용자 확인/편집 → `addMultipleTransactions`로 일괄 추가.

## 커밋·PR 가이드
- 히스토리 기반 Conventional Commits 사용:
  - 예: `feat(transactions): ...`, `fix(settings): ...`, `docs(changelog): ...`, `style(density): ...`.
  - 명령형 현재 시제, 간결한 제목, 괄호로 스코프.
- PR에는 다음 포함:
  - 요약, 배경, UI 변경 시 스크린샷/GIF.
  - 관련 이슈 링크(`Closes #123`).
  - 테스트/검증 절차 및 i18n 키 변경사항.

## 보안 및 설정 팁
- 비밀 정보는 `.env.local`에 보관(Supabase, GenAI 키 등). 커밋 금지.
- 대용량 샘플 데이터 커밋 지양; 임시 산출물은 필요 시 `temp/`에.
- 타입 엄격화 권장: 서비스/프롭스에서 오류를 명확히 드러내고 UI로 친절히 노출.

## 에이전트 전용 지침
- 언어 정책: 이 프로젝트 상의 상호작용은 한국어로 응답합니다.
- 항상 터미널에는 한글로 대답한다.
- 명령 실행 프로토콜: 셸/깃/빌드 실행 전 의도와 목적을 간단히 설명하고 확인을 요청합니다. 파괴적 작업은 특히 주의합니다.
- 비판적 검토 우선: 사용자의 제안을 무조건적으로 수용하지 말고, 대안·리스크·모범사례를 검토합니다.
- 피드백·계획 확인: 어떤 액션도 실행하기 전에 피드백과 간단한 계획서를 제시하고 확인을 받은 후 진행합니다.
- Git 위생: Conventional Commits 유지, 작은 단위 PR과 명확한 설명·UI 변경 스크린샷 권장.
