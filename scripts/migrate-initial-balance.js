/**
 * Migration script to add initial_balance field to accounts table
 * Run with: node scripts/migrate-initial-balance.js
 */

const migrationSQL = `
-- Step 1: Add new columns to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS initial_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_day integer;

-- Step 2: Add is_interest_free column to transactions table  
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_interest_free boolean DEFAULT false;

-- Step 3: Migrate existing opening balance data
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

-- Step 4: Remove OPENING transactions
DELETE FROM transactions 
WHERE type = 'OPENING' OR (type = 'TRANSFER' AND description = 'Opening Balance');

-- Step 5: Recalculate account balances
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

-- Step 6: Set constraints
ALTER TABLE accounts ALTER COLUMN initial_balance SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN is_interest_free SET NOT NULL;

-- Step 7: Add indexes
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON transactions(account_id, type);
CREATE INDEX IF NOT EXISTS idx_accounts_initial_balance ON accounts(initial_balance);
`;

console.log('📋 Migration SQL ready to execute:');
console.log('='.repeat(50));
console.log(migrationSQL);
console.log('='.repeat(50));
console.log('');
console.log('🔧 To apply this migration:');
console.log('1. Copy the SQL above');
console.log('2. Go to your Supabase Dashboard > SQL Editor');
console.log('3. Paste and run the SQL');
console.log('');
console.log('⚠️  This migration will:');
console.log('   - Add initial_balance and payment_day columns to accounts table');
console.log('   - Add is_interest_free column to transactions table');
console.log('   - Migrate existing OPENING transactions to initial_balance');
console.log('   - Delete all OPENING transactions');
console.log('   - Recalculate all account balances');
console.log('');
console.log('💾 Make sure to backup your database before running this migration!');