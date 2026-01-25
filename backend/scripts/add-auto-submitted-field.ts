/**
 * Migration Script: Add auto_submitted field to exam_attempts table
 * Run this with: tsx scripts/add-auto-submitted-field.ts
 */

import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function addAutoSubmittedField() {
    try {
        console.log('🔄 Adding auto_submitted field to exam_attempts table...');

        // Add the auto_submitted column with default value false
        await db.execute(sql`
            ALTER TABLE exam_attempts 
            ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT false;
        `);

        console.log('✅ Successfully added auto_submitted field');
        console.log('✅ Migration complete!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addAutoSubmittedField();
