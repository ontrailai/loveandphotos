# Supabase Data Tasks - Reviews Seeding & Location Backfill

This directory contains SQL migrations and Node.js scripts to:
1. Seed 5-star reviews for specific photographers with transparency (is_seeded=true)
2. Eliminate blank city/state data and enforce data integrity constraints

## 🏗️ Architecture

### Components
- **Migration**: `migrations/001_reviews_seeding_location_backfill.sql`
- **Seeding Script**: `scripts/seed-reviews.js`
- **Verification Script**: `scripts/verify-data.js`

### Features
- **Idempotent Operations**: Safe to re-run multiple times
- **Data Integrity**: Enforces NOT NULL constraints with CHECK validations
- **Transparency**: All seeded reviews marked with `is_seeded=true`
- **Automatic Rollups**: Triggers update photographer statistics in real-time
- **Comprehensive Verification**: Validates all requirements are met

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies if not already present
npm install @supabase/supabase-js

# Set environment variables
export VITE_SUPABASE_URL="your-supabase-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### Run Migration & Seeding
```bash
# Step 1: Apply database migration
npx supabase db push --file supabase-data-tasks/migrations/001_reviews_seeding_location_backfill.sql

# Alternative: Apply via SQL (if using Supabase dashboard)
# Copy contents of migration file and run in SQL Editor

# Step 2: Seed reviews data
cd supabase-data-tasks
node scripts/seed-reviews.js

# Step 3: Verify everything worked
node scripts/verify-data.js
```

## 📋 Detailed Instructions

### 1. Database Migration

The migration file handles:
- ✅ Adds `is_seeded` boolean column to reviews table
- ✅ Cleans existing location data (trims whitespace, converts NULL/'' to 'Unknown')
- ✅ Enforces NOT NULL constraints with 'Unknown' defaults
- ✅ Adds CHECK constraints to prevent empty strings
- ✅ Creates triggers for automatic review count updates
- ✅ Adds performance indexes

**Run with Supabase CLI:**
```bash
npx supabase db push --file migrations/001_reviews_seeding_location_backfill.sql
```

**Or via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy/paste contents of `migrations/001_reviews_seeding_location_backfill.sql`
3. Click "Run"

### 2. Reviews Seeding Script

Seeds 6 five-star reviews for each target photographer:
- **Sirena Salazar**
- **Winston Hermann**
- **Afsana Begum**
- **Meghana Kappala**
- **Andrew Henry**
- **Giovanni Flores**

**Features:**
- Creates realistic bookings (required for reviews)
- Generates authentic review comments with photographer names
- Randomizes dates within last 18 months
- Marks all seeded reviews with `is_seeded=true`
- Avoids duplicates by checking existing seeded count
- Updates photographer statistics automatically via triggers

**Run:**
```bash
cd supabase-data-tasks
node scripts/seed-reviews.js
```

**Sample Output:**
```
🚀 Starting reviews seeding script...

✅ Supabase client initialized
🔍 Finding photographer IDs...
📊 Found photographers:
  - Sirena Salazar: 1 current reviews
  - Winston Hermann: 1 current reviews
  [...]

👥 Getting available reviewer user IDs...
✅ Found 50 available reviewer accounts

🌱 Seeding reviews for Sirena Salazar...
   📝 Creating 6 reviews (0 existing, 6 target)
   ✅ Created review 1/6
   [...]

✅ Seeding complete! Created 36 new reviews total.
```

### 3. Verification Script

Validates that all requirements are met:
- ✅ Each target photographer has ≥6 total reviews (1 existing + 5+ new)
- ✅ Zero NULL or empty city/state values in any table
- ✅ Database constraints are working properly
- ✅ Generates summary statistics

**Run:**
```bash
cd supabase-data-tasks
node scripts/verify-data.js
```

**Sample Output:**
```
🔍 Starting data verification...

🔍 Verifying photographer reviews...
✅ Sirena Salazar:
   Total reviews: 7 (expected ≥6)
   Seeded reviews: 6
   Average rating: 5.00

🗺️ Verifying location data...
✅ All location data is complete - no NULL or empty values found

🔒 Verifying database constraints...
✅ Location constraints are working (empty string rejected)

📊 Summary Report:
   📝 Total seeded reviews: 36
   👥 Photographers with reviews: 125
   ⭐ Total reviews system-wide: 890
   🗺️ Profiles with real location data: 520

==================================================
✅ ALL VERIFICATIONS PASSED!
The migration and seeding completed successfully.
```

## 🔧 Configuration

### Target Photographers
Edit `scripts/seed-reviews.js` to modify the photographer list:
```javascript
const PHOTOGRAPHERS = [
  'Sirena Salazar',
  'Winston Hermann',
  // Add/remove names as needed
];
```

### Reviews Per Photographer
Adjust the number of reviews to create:
```javascript
const REVIEWS_PER_PHOTOGRAPHER = 6; // Change as needed (5-8 range recommended)
```

### Review Templates
Customize review comments by editing the `REVIEW_TEMPLATES` array in `seed-reviews.js`.

## 🔍 Database Schema Changes

### Reviews Table
```sql
-- New column added
ALTER TABLE reviews ADD COLUMN is_seeded BOOLEAN DEFAULT FALSE;

-- Index for performance
CREATE INDEX idx_reviews_is_seeded ON reviews(is_seeded) WHERE is_seeded = TRUE;
```

### Photographer Preview Profiles
```sql
-- Enforce data integrity
ALTER TABLE photographer_preview_profiles
  ALTER COLUMN location_city SET DEFAULT 'Unknown',
  ALTER COLUMN location_city SET NOT NULL,
  ALTER COLUMN location_state SET DEFAULT 'Unknown',
  ALTER COLUMN location_state SET NOT NULL;

-- Prevent empty strings
ALTER TABLE photographer_preview_profiles
  ADD CONSTRAINT check_location_city_not_empty CHECK (location_city != ''),
  ADD CONSTRAINT check_location_state_not_empty CHECK (location_state != '');
```

## 🛠️ Troubleshooting

### Common Issues

**Missing Environment Variables:**
```bash
❌ Missing Supabase environment variables
Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```
**Solution:** Export environment variables or add to `.env` file

**Migration Fails:**
```sql
ERROR: relation "reviews" does not exist
```
**Solution:** Ensure you're running against the correct database with existing schema

**No Available Reviewers:**
```bash
❌ No available users found for reviewers
```
**Solution:** Ensure there are user accounts that aren't photographers

**Constraint Violations:**
```sql
ERROR: new row violates check constraint "check_location_city_not_empty"
```
**Solution:** This is expected behavior - constraints are working properly

### Re-running Scripts

All scripts are **idempotent** and safe to re-run:
- **Migration**: Uses `IF NOT EXISTS` and `COALESCE` for safety
- **Seeding**: Checks existing seeded count to avoid duplicates
- **Verification**: Read-only operations

### Rollback

To rollback changes:
```sql
-- Remove seeded reviews
DELETE FROM reviews WHERE is_seeded = TRUE;

-- Remove is_seeded column
ALTER TABLE reviews DROP COLUMN is_seeded;

-- Relax location constraints (optional)
ALTER TABLE photographer_preview_profiles
  ALTER COLUMN location_city DROP NOT NULL,
  ALTER COLUMN location_state DROP NOT NULL,
  DROP CONSTRAINT check_location_city_not_empty,
  DROP CONSTRAINT check_location_state_not_empty;
```

## 📊 Expected Results

After successful completion:

### Target Photographers
Each will have:
- **Total Reviews**: Original count + 6 new reviews
- **Average Rating**: 5.00 (all seeded reviews are 5-star)
- **Seeded Reviews**: 6 reviews marked with `is_seeded=true`

### Location Data
- **Zero NULL/empty values** in `location_city` or `location_state` columns
- **Default value**: 'Unknown' for any previously missing data
- **Constraints**: Prevent future empty/null values

### Database Integrity
- **Automatic rollups**: Review counts update in real-time via triggers
- **Data validation**: CHECK constraints prevent empty strings
- **Transparency**: All seeded data clearly marked

## 🏷️ Tags & Metadata

- **Safe to run in production**: ✅ (uses transactions and validation)
- **Idempotent**: ✅ (can be re-run safely)
- **Transparent**: ✅ (seeded data clearly marked)
- **Comprehensive**: ✅ (includes verification and rollback instructions)

---

**Generated by**: `/sc:implement` with backend persona
**Compatible with**: Supabase, PostgreSQL 13+, Node.js 16+
**Last updated**: 2025-01-12