-- Migration: Add initial_balance to accounts table and update related fields
-- Created: 2025-09-10
-- Purpose: Move opening balance from transactions to accounts table

-- Step 1: Add new columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS initial_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_day integer;

-- Step 2: Add is_interest_free column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_interest_free boolean DEFAULT false;

-- Step 3: Migrate existing opening balance data
-- For each account, find any OPENING transactions and convert them to initial_balance
UPDATE accounts 
SET initial_balance = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN t.type = 'OPENING' THEN t.amount
      WHEN t.type = 'TRANSFER' AND t.description = 'Opening Balance' THEN t.amount
      ELSE 0
    END
  ), 0)
  FROM transactions t 
  WHERE t.account_id = accounts.id
);

-- Step 4: Remove OPENING transactions (they're now stored as initial_balance)
DELETE FROM transactions 
WHERE type = 'OPENING' OR (type = 'TRANSFER' AND description = 'Opening Balance');

-- Step 5: Recalculate all account balances using new formula
-- balance = initial_balance + sum of all non-opening transactions
UPDATE accounts 
SET balance = initial_balance + (
  SELECT COALESCE(SUM(
    CASE 
      WHEN t.type = 'INCOME' THEN t.amount
      WHEN t.type = 'EXPENSE' THEN -t.amount
      WHEN t.type = 'TRANSFER' THEN -t.amount
      ELSE 0
    END
  ), 0)
  FROM transactions t 
  WHERE t.account_id = accounts.id
    AND t.type != 'OPENING'
    AND NOT (t.type = 'TRANSFER' AND t.description = 'Opening Balance')
);

-- Step 6: Update default accounts with correct initial_balance
UPDATE accounts 
SET initial_balance = 0, payment_day = NULL
WHERE id = '00000000-0000-0000-0000-000000000001'; -- Default cash account

-- Step 7: Add constraints and indexes for better performance
ALTER TABLE accounts ALTER COLUMN initial_balance SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN is_interest_free SET NOT NULL;

-- Add index on account_id and type for faster balance calculations
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON transactions(account_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_initial_balance ON accounts(initial_balance);

-- Step 8: Add comments for documentation
COMMENT ON COLUMN accounts.initial_balance IS 'Starting balance of the account, separate from transaction history';
COMMENT ON COLUMN accounts.payment_day IS 'Payment day for credit cards (1-31), null for other account types';
COMMENT ON COLUMN transactions.is_interest_free IS 'Whether installment transactions are interest-free';