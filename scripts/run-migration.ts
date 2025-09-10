#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { supabase } from '../services/supabase';

/**
 * Migration runner script
 * Usage: npx tsx scripts/run-migration.ts [migration-file]
 */

async function runMigration(migrationFile: string) {
  try {
    console.log(`🚀 Running migration: ${migrationFile}`);
    
    // Read migration SQL file
    const migrationPath = join(__dirname, '..', 'migrations', migrationFile);
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons to execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   ${i + 1}/${statements.length}: Executing statement...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_text: statement 
      });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2] || 'add_initial_balance_fields.sql';

runMigration(migrationFile)
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });