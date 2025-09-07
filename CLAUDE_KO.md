# CLAUDE.md

이 파일은 이 저장소의 코드 작업 시 Claude Code (claude.ai/code)에게 지침을 제공합니다.

## 프로젝트 개요

React 19, TypeScript, Vite로 구축된 AI 기반 가계부 애플리케이션입니다. 은행 거래내역서 이미지 분석을 위한 Google Gemini AI 통합과 데이터 지속성을 위한 모의 Supabase 서비스를 사용합니다.

## 개발 명령어

- `npm run dev` - Vite로 개발 서버 시작
- `npm run build` - 프로덕션 번들 빌드
- `npm run preview` - 프로덕션 빌드 로컬 미리보기
- `npm install` - 의존성 설치

## 환경 설정

AI 기능이 작동하려면 `.env.local`에 `GEMINI_API_KEY`가 필요합니다. vite.config.ts는 이를 클라이언트에서 `process.env.API_KEY`와 `process.env.GEMINI_API_KEY` 모두로 노출합니다.

## 아키텍처 개요

### 데이터 플로우 패턴
이 앱은 커스텀 훅을 사용하여 중앙화된 데이터 관리 패턴을 따릅니다:

1. **useData Hook** (`hooks/useData.ts`) - 중앙 데이터 관리 계층:
   - 계좌, 거래, 파생된 할부 상태 관리
   - 계좌와 거래에 대한 CRUD 작업 제공
   - 거래 변경 시 계좌 잔액과 할부를 자동으로 재계산
   - 로딩 상태와 에러 관리 처리

2. **서비스 계층** - 두 가지 서비스 구현:
   - `supabaseService.ts` - 인위적인 지연을 가진 모의 데이터베이스 서비스
   - `geminiService.ts` - 거래 분석을 위한 Google Gemini AI 통합

### 상태 관리 전략
- 모든 데이터는 `UseDataReturn` 인터페이스를 제공하는 `useData` 훅을 통해 흐름
- 페이지들은 이 훅을 통해 데이터와 작업을 받아 컴포넌트에 전달
- 거래가 수정되면 계좌 잔액이 자동으로 재계산됨
- 할부는 `installmentMonths > 1`인 거래에서 파생됨

### 페이지 구조
- **App.tsx** - 사이드바 네비게이션이 있는 메인 라우터 컴포넌트
- **DashboardPage** - Recharts를 사용한 차트 및 재정 개요
- **AccountsPage** - CRUD 작업을 통한 계좌 관리
- **InstallmentsPage** - 자동 계산된 할부 추적
- **TransactionsPage** - 거래 관리

### AI 통합 패턴
AI 어시스턴트 (`components/AIAssist.tsx`)는 다단계 워크플로우를 따릅니다:
1. 파일 업로드 (은행 거래내역서 이미지)
2. 구조화된 스키마를 통한 Gemini API 분석
3. 거래 확인/편집 인터페이스
4. `addMultipleTransactions`을 통한 배치 거래 가져오기

## 주요 구현 세부사항

### 잔액 계산
계좌 잔액은 거래가 수정될 때마다 `supabaseService.ts`에서 자동으로 재계산됩니다. 시스템은:
- 원본 모의 계좌 잔액에서 시작
- 초기 잔액을 얻기 위해 원본 모의 거래를 차감
- 최종 잔액을 도출하기 위해 현재 거래를 적용

### 할부 로직
할부는 `installmentMonths > 1`인 거래에서 `useData.ts`에서 파생됩니다:
- 거래 날짜 이후 경과한 개월 수 계산
- 남은 개월 수와 지불액 결정
- 완료된 할부 필터링

### TypeScript 패턴
- 열거형의 광범위한 사용 (`TransactionType`, `AccountPropensity`)
- 일반적인 CRUD 패턴: 생성을 위한 `Omit<T, 'id'>`, 업데이트를 위한 전체 `T`
- 훅의 일관된 반환 타입 패턴 (`UseDataReturn`)

### 컴포넌트 관례
- 데이터 입력을 위한 모달 기반 폼
- `Intl.NumberFormat`을 사용한 일관된 통화 형식
- `constants.ts`의 일관된 색상 체계로 데이터 시각화를 위한 Recharts

## 파일 구조

코드베이스는 기능 기반 구조를 사용합니다:
- `/components` - 재사용 가능한 UI 컴포넌트 (layout, ui, icons)
- `/pages` - 라우트 레벨 페이지 컴포넌트
- `/services` - 외부 API 통합 및 데이터 접근
- `/hooks` - 상태 관리를 위한 커스텀 React 훅
- 루트 레벨 파일: types, constants, configuration

## 개발 참고사항

- 앱은 tsconfig.json과 vite.config.ts 모두에서 구성된 경로 별칭 (`@/`)을 사용
- `constants.ts`의 모의 데이터 배열은 빈 상태로 시작 - 실제 데이터는 서비스 계층을 통해 제공
- 모든 비동기 작업에서 try/catch 패턴으로 일관된 에러 처리
- 모든 서비스 호출은 실제 API 동작을 시뮬레이션하기 위한 인위적인 지연 포함