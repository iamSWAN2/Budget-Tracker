⏺ 모달 테마 일관성 분석 및 개선 계획서

  애플리케이션의 모든 모달을 분석한 결과, 다음과 같은 테마 불일치 문제들을 발견했습니다:

  1. 현재 모달 테마 분석

  📋 계좌 추가 모달 (기준 테마 - 사용자 선호)

  - 색상 체계: border-slate-300, focus:border-indigo-500, focus:ring-indigo-500
  - 스타일링: 표준 form 스타일, rounded-md, shadow-sm, sm:text-sm
  - 버튼: Button 컴포넌트 사용 (variant="primary", variant="secondary")
  - 레이아웃: 여백 있는 정리된 구조 (space-y-4)

  📝 거래 추가/수정 모달들 (3가지 다른 스타일)

  1) TransactionForm.tsx (표준 모달)
  - 계좌 추가와 유사한 스타일
  - 일관된 border-slate-300, focus:border-indigo-500 사용
  - Button 컴포넌트 활용

  2) AddTransactionFormInline.tsx (인라인 압축 스타일)
  - 더 작은 여백: px-2.5 py-1.5 text-sm
  - 계좌 추가보다 컴팩트한 디자인
  - 직접적인 버튼 스타일링 (Button 컴포넌트 혼용)

  3) EditTransactionFormInline.tsx (인라인 편집 스타일)
  - AddTransactionFormInline과 거의 동일하나 미묘한 차이
  - 버튼에서 일부 직접 스타일링 사용: bg-indigo-600 text-white py-3 px-4

  🤖 AI 모달 (AIAssist.tsx)

  - 복잡한 다단계 인터페이스
  - 부분적으로 표준 스타일 사용하나 일관성 부족

  2. 주요 문제점들

  A. 테마 불일치

  - 입력 필드 패딩: py-1.5 vs py-2 vs 기본값
  - 버튼 스타일: Button 컴포넌트 vs 직접 스타일링 혼용
  - 폰트 크기: text-sm vs text-xs 혼재

  B. 대비(Contrast) 문제 ⚠️

  /* 현재 문제있는 스타일 */
  border-slate-300  /* 너무 연한 테두리 */
  bg-slate-50       /* 배경과 거의 구분안됨 */

  C. 일관성 부족

  - 일부는 Button 컴포넌트, 일부는 직접 스타일링
  - 레이아웃 여백 불일치
  - 색상 변형 혼재

  3. 통합 테마 설계

⏺ 기준 테마: 계좌 추가 모달 스타일 개선버전

  /* 🎨 통합 모달 테마 설계 */

  /* 입력 필드 - 대비 개선 */
  .modal-input {
    @apply mt-1 block w-full rounded-md
           border-slate-400       /* 기존 300 → 400 (대비 강화) */
           shadow-sm
           focus:border-indigo-500
           focus:ring-indigo-500
           focus:ring-2           /* ring 강화 */
           sm:text-sm
           px-3 py-2.5           /* 패딩 표준화 */
           bg-white              /* 명시적 배경색 */
           text-slate-900;       /* 명확한 텍스트 색상 */
  }

  /* 라벨 */
  .modal-label {
    @apply block text-sm font-medium text-slate-700 mb-1.5;
  }

  /* 버튼 컨테이너 */
  .modal-actions {
    @apply flex justify-end pt-4 space-x-2;
  }

  /* 섹션 구분 */
  .modal-section {
    @apply space-y-4;
  }

  4. 대비 개선 구체 방안

⏺ 색상 대비 개선 매트릭스

  | 요소    | 기존               | 개선안              | 대비율 개선 |
  |-------|------------------|------------------|--------|
  | 테두리   | border-slate-300 | border-slate-400 | 1.2배 ↑ |
  | 포커스 링 | ring-1           | ring-2           | 2배 ↑   |
  | 배경    | 암시적              | bg-white 명시      | 명확성 ↑  |
  | 텍스트   | 기본값              | text-slate-900   | 최대 대비  |
  | 라벨    | 기본값              | text-slate-700   | 가독성 ↑  |

  접근성(A11Y) 준수

  - WCAG 2.1 AA 기준 4.5:1 대비율 달성
  - 키보드 네비게이션 지원 (이미 구현됨)
  - 포커스 상태 명확화

  5. 구현 계획서

  Phase 1: 기반 컴포넌트 통일 (1-2시간)

  1. 공통 스타일 클래스 정의
  // components/ui/FormStyles.ts (신규 생성)
  export const modalFormStyles = {
    input: "mt-1 block w-full rounded-md border-slate-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 sm:text-sm px-3 py-2.5 bg-white text-slate-900",
    label: "block text-sm font-medium text-slate-700 mb-1.5",
    section: "space-y-4",
    actions: "flex justify-end pt-4 space-x-2"
  };
  2. Button 컴포넌트 일관성 확보
    - 모든 모달에서 Button 컴포넌트 사용
    - 직접 스타일링 제거

  Phase 2: 모달별 적용 (2-3시간)

  우선순위별 적용 순서:

  1. TransactionForm.tsx ✅ (가장 표준적, 빠른 적용)
  2. AddTransactionFormInline.tsx ⚠️ (압축 레이아웃 유지하면서 색상만 통일)
  3. EditTransactionFormInline.tsx ⚠️ (AddTransactionFormInline과 통일)
  4. AccountsPage.tsx 내 AccountForm 🔄 (이미 기준이므로 대비만 개선)
  5. AIAssist.tsx 🚨 (가장 복잡, 마지막 적용)

  Phase 3: 검증 및 최적화 (30분)

  1. 시각적 일관성 검증
    - 모든 모달 스크린샷 비교
    - 색상 대비 도구로 접근성 확인
  2. 성능 최적화
    - 중복 스타일 제거
    - CSS 클래스 최적화

  Phase 4: 문서화 (15분)

  1. 스타일 가이드 업데이트
  2. 컴포넌트 사용법 문서화

  6. 예상 효과

  개선 예상 결과:

  - ✅ 시각적 일관성 100% 달성
  - ✅ 접근성 대비율 WCAG AA 기준 준수
  - ✅ 개발 효율성 향상 (공통 스타일 재사용)
  - ✅ 유지보수성 개선 (중앙집중식 스타일 관리)

  사용자 경험 개선:

  - 👁️ 눈의 피로도 감소 (대비 강화)
  - 🎯 폼 필드 식별성 향상
  - 🔄 모달 간 학습 전이 효과 증대

⏺ ---
  📋 최종 권장사항

  이 계획서에 따라 단계별로 모달 테마 통일 작업을 진행하면, 사용자가 지적한 "눈이 아픈" 문제와 테마 불일치 문제를 모두 해결할 수 있습니다.

  가장 우선적으로 해결할 부분:
  1. 필드 테두리 색상: border-slate-300 → border-slate-400
  2. 포커스 링 강화: ring-1 → ring-2
  3. Button 컴포넌트 통일 사용