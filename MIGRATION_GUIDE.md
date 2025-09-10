# Database Migration Guide

## Initial Balance Migration (2025-09-10)

### 개요
오프닝 밸런스를 거래 내역(`transactions` 테이블의 OPENING 타입)에서 계좌 관리(`accounts` 테이블의 `initial_balance` 필드)로 이관하는 마이그레이션입니다.

### 변경사항

#### 1. `accounts` 테이블
- `initial_balance` 컬럼 추가 (numeric, NOT NULL, DEFAULT 0)
- `payment_day` 컬럼 추가 (integer, NULL) - 신용카드 결제일

#### 2. `transactions` 테이블  
- `is_interest_free` 컬럼 추가 (boolean, NOT NULL, DEFAULT false) - 무이자 할부 여부

#### 3. 데이터 마이그레이션
- 기존 OPENING 타입 거래들을 `initial_balance`로 변환
- OPENING 거래들 삭제
- 모든 계좌 잔액 재계산

### 마이그레이션 실행 방법

#### 방법 1: Supabase Dashboard 사용 (권장)
1. [Supabase Dashboard](https://supabase.com) → 프로젝트 선택 → SQL Editor
2. `scripts/migrate-initial-balance.js` 실행하여 SQL 확인:
   ```bash
   node scripts/migrate-initial-balance.js
   ```
3. 출력된 SQL을 복사하여 Supabase SQL Editor에서 실행

#### 방법 2: SQL 파일 직접 사용
1. `migrations/add_initial_balance_fields.sql` 파일의 내용을 복사
2. Supabase Dashboard > SQL Editor에서 실행

### 마이그레이션 전 체크리스트

- [ ] 데이터베이스 백업 완료
- [ ] 개발/스테이징 환경에서 테스트 완료
- [ ] 사용자에게 점검 공지 (잠시 서비스 중단 가능)

### 마이그레이션 후 확인사항

```sql
-- 1. 새로운 컬럼들이 추가되었는지 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name IN ('initial_balance', 'payment_day');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'is_interest_free';

-- 2. OPENING 타입 거래가 모두 삭제되었는지 확인
SELECT COUNT(*) as opening_transactions 
FROM transactions 
WHERE type = 'OPENING' OR (type = 'TRANSFER' AND description = 'Opening Balance');
-- 결과: 0이어야 함

-- 3. 모든 계좌에 initial_balance가 설정되었는지 확인  
SELECT COUNT(*) as accounts_without_initial_balance
FROM accounts 
WHERE initial_balance IS NULL;
-- 결과: 0이어야 함

-- 4. 잔액 계산이 올바른지 확인
SELECT 
  a.name,
  a.initial_balance,
  a.balance,
  (a.initial_balance + COALESCE(SUM(
    CASE 
      WHEN t.type = 'INCOME' THEN t.amount
      WHEN t.type = 'EXPENSE' THEN -t.amount  
      WHEN t.type = 'TRANSFER' THEN -t.amount
      ELSE 0
    END
  ), 0)) as calculated_balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id
GROUP BY a.id, a.name, a.initial_balance, a.balance;
-- balance와 calculated_balance가 일치해야 함
```

### 롤백 방법

마이그레이션에 문제가 있을 경우:

```sql
-- 1. 백업에서 데이터 복원
-- 또는
-- 2. 수동 롤백 (권장하지 않음)
ALTER TABLE accounts DROP COLUMN IF EXISTS initial_balance;
ALTER TABLE accounts DROP COLUMN IF EXISTS payment_day;
ALTER TABLE transactions DROP COLUMN IF EXISTS is_interest_free;
```

### 주의사항

- 이 마이그레이션은 **비가역적**입니다 (OPENING 거래들이 삭제됨)
- 실행 전 반드시 데이터베이스 백업을 수행하세요
- 마이그레이션 실행 중에는 애플리케이션 접근을 제한하세요
- 대용량 데이터의 경우 실행 시간이 오래 걸릴 수 있습니다

### 문제 해결

**마이그레이션 실패 시:**
1. 에러 로그 확인
2. 데이터베이스 백업에서 복원
3. 문제 해결 후 다시 실행

**성능 이슈 발생 시:**
- 인덱스가 제대로 생성되었는지 확인
- 통계 정보 업데이트: `ANALYZE accounts, transactions;`