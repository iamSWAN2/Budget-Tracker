# Supabase 데이터베이스 스키마

이 문서는 가계부 애플리케이션을 위한 Supabase 데이터베이스 스키마를 설명합니다.

## 환경 설정

먼저 `.env.local` 파일에 다음 환경 변수를 설정해주세요:

```env
GEMINI_API_KEY=your-gemini-api-key-here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## 데이터베이스 테이블 스키마

### 1. accounts 테이블

계좌 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  propensity VARCHAR(50) NOT NULL,
  payment_day INTEGER DEFAULT NULL CHECK (payment_day >= 1 AND payment_day <= 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) 활성화 (선택사항)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽고 쓸 수 있도록 정책 설정 (개발용)
CREATE POLICY "Allow all operations on accounts" ON accounts
  FOR ALL USING (true) WITH CHECK (true);
```

**필드 설명:**
- `id`: 계좌 고유 식별자 (UUID)
- `name`: 계좌명 (예: "신한은행 주계좌")
- `balance`: 현재 잔액 (소수점 2자리까지)
- `propensity`: 계좌 유형 (`Checking`, `Savings`, `Credit Card`, `Investment`, `Cash`, `Loan`)
- `payment_day`: 신용카드 결제일 (1-31, Credit Card일 때만 사용)
- `created_at`, `updated_at`: 생성 및 수정 시간

### 2. transactions 테이블

거래 내역을 저장하는 테이블입니다.

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
  category VARCHAR(100) NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  installment_months INTEGER DEFAULT 1,
  is_interest_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);

-- RLS (Row Level Security) 활성화 (선택사항)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽고 쓸 수 있도록 정책 설정 (개발용)
CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);
```

**필드 설명:**
- `id`: 거래 고유 식별자 (UUID)
- `date`: 거래 날짜 (YYYY-MM-DD)
- `description`: 거래 설명 (예: "마트에서 장보기")
- `amount`: 거래 금액 (양수)
- `type`: 거래 유형 (`INCOME`, `EXPENSE`, `TRANSFER`)
- `category`: 거래 카테고리 (예: "식비", "교통비", "급여")
- `account_id`: 연결된 계좌 ID (외래키)
- `installment_months`: 할부 개월 수 (1이면 일시불)
- `is_interest_free`: 무이자 할부 여부 (true: 무이자, false: 일반 할부)
- `created_at`, `updated_at`: 생성 및 수정 시간

### 3. updated_at 자동 업데이트 트리거

두 테이블 모두에 `updated_at` 필드를 자동으로 업데이트하는 트리거를 설정합니다:

```sql
-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    return NEW;
END;
$$ language 'plpgsql';

-- accounts 테이블에 트리거 적용
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- transactions 테이블에 트리거 적용
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 애플리케이션 연동

### 1. 의존성 설치

```bash
npm install @supabase/supabase-js
```

### 2. Supabase 클라이언트 설정

`services/supabase.ts` 파일에서 Supabase 클라이언트를 초기화합니다.

### 3. 데이터 마이그레이션

기존 모의 데이터를 Supabase로 마이그레이션하려면:

1. Supabase 대시보드에서 위 스키마를 실행
2. 초기 계좌 데이터 삽입:

```sql
INSERT INTO accounts (name, balance, propensity) VALUES 
('주 계좌', 1000000, 'Checking'),
('적금 계좌', 5000000, 'Savings'),
('신용카드', -200000, 'Credit Card');
```

## 특징

- **자동 잔액 계산**: 거래 내역을 기반으로 계좌 잔액을 자동 계산
- **할부 지원**: `installment_months` 필드로 할부 거래 추적
- **외래키 제약조건**: 데이터 무결성 보장
- **인덱스 최적화**: 빠른 조회를 위한 인덱스 설정
- **타임스탬프 자동 관리**: 생성/수정 시간 자동 기록

## 주의사항

1. **환경 변수**: 실제 Supabase URL과 anon key를 설정해야 합니다
2. **RLS 정책**: 프로덕션 환경에서는 적절한 보안 정책을 설정하세요
3. **데이터 백업**: 중요한 데이터는 정기적으로 백업하세요
4. **성능 모니터링**: 대량 데이터 처리 시 쿼리 성능을 모니터링하세요