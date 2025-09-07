# CLAUDE_KO.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소의 코드 작업을 할 때 지침을 제공합니다.

## 언어 정책

Claude Code는 이 프로젝트에서 모든 사용자 상호작용과 커뮤니케이션에 대해 항상 한국어로 응답해야 합니다.

## 파일 유지관리

CLAUDE.md가 수정되면 Claude Code는 다음을 수행해야 합니다:
1. 업데이트된 CLAUDE.md 파일의 전체 내용을 읽기
2. 모든 내용의 완전한 한국어 번역본 생성
3. 한국어 버전을 동일한 디렉토리에 CLAUDE_KO.md로 저장
4. 정확성을 유지하면서 모든 기술 용어와 개념이 적절히 번역되도록 보장

## 프로젝트 개요

이 프로젝트는 React 19, TypeScript, Vite로 구축된 AI 기반 가계부 애플리케이션입니다. 이 앱은 은행 명세서 이미지에서 거래를 분석하기 위해 Google Gemini AI와 통합되며, 데이터 지속성을 위해 모의 Supabase 서비스를 사용합니다.

## 개발 명령어

- `npm run dev` - Vite로 개발 서버 시작
- `npm run build` - 프로덕션 번들 빌드
- `npm run preview` - 프로덕션 빌드 로컬에서 미리보기
- `npm install` - 의존성 설치

## 환경 설정

이 앱은 AI 기능이 작동하려면 `.env.local`에 `GEMINI_API_KEY`가 필요합니다. vite.config.ts는 이것을 클라이언트에서 `process.env.API_KEY`와 `process.env.GEMINI_API_KEY` 모두로 노출합니다.

## 아키텍처 개요

### 데이터 플로우 패턴
앱은 커스텀 훅을 사용한 중앙집중식 데이터 관리 패턴을 따릅니다:

1. **useData 훅** (`hooks/useData.ts`) - 중앙 데이터 관리 계층:
   - 계정, 거래, 파생된 할부 상태 관리
   - 계정 및 거래를 위한 CRUD 작업 제공
   - 거래 변경 시 계정 잔액과 할부를 자동으로 재계산
   - 로딩 상태 및 오류 관리 처리

2. **서비스 계층** - 두 가지 서비스 구현:
   - `supabaseService.ts` - 인위적 지연이 있는 모의 데이터베이스 서비스
   - `geminiService.ts` - 거래 분석을 위한 Google Gemini AI 통합

### 상태 관리 전략
- 모든 데이터는 `UseDataReturn` 인터페이스를 제공하는 `useData` 훅을 통해 흐름
- 페이지는 이 훅을 통해 데이터와 작업을 받고 컴포넌트에 전달
- 거래가 수정되면 계정 잔액이 자동으로 재계산됨
- 할부는 `installmentMonths > 1`인 거래에서 파생됨

### 페이지 구조
- **App.tsx** - 사이드바 네비게이션이 있는 메인 라우터 컴포넌트
- **DashboardPage** - Recharts를 사용한 차트 및 재정 개요
- **AccountsPage** - CRUD 작업이 있는 계정 관리
- **InstallmentsPage** - 자동 계산되는 할부 추적
- **TransactionsPage** - 거래 관리

### AI 통합 패턴
AI 어시스턴트(`components/AIAssist.tsx`)는 다단계 워크플로우를 따릅니다:
1. 파일 업로드 (은행 명세서 이미지)
2. 구조화된 스키마를 통한 Gemini API 분석
3. 거래 확인/편집 인터페이스
4. `addMultipleTransactions`를 통한 일괄 거래 가져오기

## 주요 구현 세부사항

### 잔액 계산
계정 잔액은 거래가 수정될 때마다 `supabaseService.ts`에서 자동으로 재계산됩니다. 시스템은:
- 원래 모의 계정 잔액에서 시작
- 초기 잔액을 얻기 위해 원래 모의 거래를 차감
- 최종 잔액을 얻기 위해 현재 거래를 적용

### 할부 로직
할부는 `useData.ts`에서 `installmentMonths > 1`인 거래로부터 파생됩니다:
- 거래 날짜 이후 경과된 개월 수 계산
- 남은 개월과 결제 금액 결정
- 완료된 할부 필터링

### TypeScript 패턴
- 열거형의 광범위한 사용 (`TransactionType`, `AccountPropensity`)
- 일반적인 CRUD 패턴: 생성을 위한 `Omit<T, 'id'>`, 업데이트를 위한 전체 `T`
- 훅에서의 일관된 반환 타입 패턴 (`UseDataReturn`)

### 컴포넌트 규칙
- 데이터 입력을 위한 모달 기반 폼
- `Intl.NumberFormat`을 사용한 일관된 통화 형식
- `constants.ts`의 일관된 색상 스키마를 사용한 데이터 시각화를 위한 Recharts

## 파일 구조

코드베이스는 기능 기반 구조를 사용합니다:
- `/components` - 재사용 가능한 UI 컴포넌트 (레이아웃, ui, 아이콘)
- `/pages` - 라우트 레벨 페이지 컴포넌트
- `/services` - 외부 API 통합 및 데이터 접근
- `/hooks` - 상태 관리를 위한 커스텀 React 훅
- 루트 레벨 파일: 타입, 상수, 구성

## 개발 참고사항

- 앱은 tsconfig.json과 vite.config.ts 둘 다에서 구성된 경로 별칭(`@/`)을 사용
- `constants.ts`의 모의 데이터 배열은 비어있게 시작 - 실제 데이터는 서비스 계층을 통해 제공
- 모든 비동기 작업에서 try/catch 패턴을 사용한 일관된 오류 처리
- 모든 서비스 호출에는 실제 API 동작을 시뮬레이션하기 위한 인위적 지연 포함

## Claude Code 행동 지침

이 코드베이스를 작업할 때 Claude Code는 다음 상호작용 프로토콜을 따라야 합니다:

### 명령 실행 프로토콜
시스템 명령을 실행하기 전에 Claude Code는 반드시:
1. **행동 설명**: 명령이 무엇을 할 것인지와 그 목적을 명확히 설명
2. **확인 요청**: 실행 전에 사용자에게 명시적인 허가를 요청
3. **예시 형식**:
   ```
   로컬 커밋을 GitHub에 업로드하기 위해 `git push origin main`을 실행해야 합니다.
   이는 코드를 원격 저장소에 공개적으로 사용 가능하게 만들 것입니다.
   이 작업을 진행해도 될까요?
   ```

### Git 작업
- 실행 전에 항상 git 명령어 설명 (add, commit, push, pull 등)
- 버전 관리 및 원격 저장소에 대한 영향 설명
- 파괴적인 작업(force push, reset, rebase)은 특별히 주의하여 확인

### 파일 시스템 작업
- 파일 생성, 수정 또는 삭제 작업 설명
- 구조적 변경의 목적과 영향 설명
- 프로젝트 구성에 영향을 주는 작업에 대한 허가 요청

### 빌드 및 배포 작업
- 빌드 프로세스와 그 결과물 설명
- 배포 의미와 대상 설명
- 프로덕션 또는 공개 접근에 영향을 줄 수 있는 작업 확인

이 프로토콜은 투명한 커뮤니케이션을 보장하고 의도하지 않은 시스템 수정을 방지합니다.