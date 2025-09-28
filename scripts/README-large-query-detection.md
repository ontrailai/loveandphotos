# Large Query Detection CI Tool

This tool prevents regression of oversized Supabase `.in()` queries that can cause `net::ERR_FAILED` errors due to URL length limits.

## Problem Background

Browser URL length limits (2-8KB) can be exceeded when building Supabase queries with large arrays:

```javascript
// ❌ Problematic - Can cause net::ERR_FAILED with 1000+ IDs
const { data } = await supabase
  .from('photographers')
  .select('*')
  .in('user_id', thousandsOfUserIds)  // ~36KB URL = Browser error
```

## Solution

Use the batching utility to split large queries:

```javascript
// ✅ Safe - Uses batching to stay under URL limits
import { fetchInBatches } from '@utils/batchSupabaseQueries'

const { data } = await fetchInBatches(
  supabase,
  'photographers',
  '*',
  'user_id',
  thousandsOfUserIds,
  { batchSize: 50 }  // Safe batches of 50 items
)
```

## Usage

### Manual Scan
```bash
npm run lint:queries
```

### CI Integration
```bash
# In your CI pipeline (e.g., GitHub Actions)
npm run lint:queries  # Exit code 1 if critical issues found
```

### Test Suite Integration
```bash
npm run test:all  # Includes query linting
```

## Detection Rules

The tool detects:

### 🚨 **Errors** (Block CI)
- **Large Literal Arrays**: `.in('col', [id1, id2, ...])` with >50 items
- Direct violation of safe query size limits

### ⚠️ **Warnings** (Flag for Review)
- **Suspicious Variables**: Arrays with names like `userIds`, `photographerIds`, etc.
- Variables that likely contain large datasets

### ℹ️ **Info** (Best Practice)
- **Dynamic Arrays**: Function calls or expressions that may produce large arrays
- **Missing Imports**: Files with Supabase queries but no batching utility

## Configuration

Edit `scripts/check-large-queries.js` to adjust:

```javascript
const MAX_ARRAY_SIZE = 50        // Array size threshold
const SUSPICIOUS_PATTERNS = [    // Variable name patterns to flag
  /userIds|photographerIds/i,
  /users\.map|photographers\.map/i
]
```

## CI Integration Examples

### GitHub Actions
```yaml
- name: Check for large Supabase queries
  run: npm run lint:queries
```

### Pre-commit Hook
```bash
#!/bin/sh
npm run lint:queries || {
  echo "❌ Large query check failed. Fix issues before committing."
  exit 1
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "lint:queries": "node scripts/check-large-queries.js",
    "test:all": "npm run test:api && npm run test:frontend && npm run lint:queries"
  }
}
```

## Output

The tool provides:
- **Console output** with file locations and suggestions
- **JSON results** (`large-query-scan-results.json`) for CI parsing
- **Exit codes** for CI integration (0=success, 1=critical issues)

### Example Output
```
🔍 Large Supabase Query Detection Results
==========================================

📁 Files scanned: 156
⚠️  Total issues: 2
❌ Errors: 1
⚠️  Warnings: 1

📄 src/pages/Browse.jsx
-----------------------
  ❌ Line 195: Large literal array in .in() query (120 items). Use fetchInBatches for arrays > 50 items.
     Code: .in('user_id', [id1, id2, id3...])
     💡 Replace with: await fetchInBatches(client, table, fields, column, array, { batchSize: 50 })

  ⚠️ Line 210: Potentially large array variable "allPhotographerIds" in .in() query.
     Code: .in('user_id', allPhotographerIds)
     💡 If array can be large, use fetchInBatches instead of direct .in() query
```

## Quick Fix Guide

1. **Install batching utility**:
   ```javascript
   import { fetchInBatches } from '@utils/batchSupabaseQueries'
   ```

2. **Replace large .in() queries**:
   ```javascript
   // Before
   const { data } = await supabase.from('table').select('*').in('col', largeArray)

   // After
   const { data } = await fetchInBatches(supabase, 'table', '*', 'col', largeArray, { batchSize: 50 })
   ```

3. **Test your changes**:
   ```bash
   npm run lint:queries
   ```

## Related Files

- `src/utils/batchSupabaseQueries.js` - Batching utility implementation
- `tests/unit/batchSupabaseQueries.test.js` - Unit tests for batching
- `tests/e2e/contract-resilience.spec.js` - E2E tests for query resilience

## Troubleshooting

### False Positives
If the tool flags safe usage:
1. Verify array size is actually safe (<50 items)
2. Add inline comments explaining why batching isn't needed
3. Consider using batching anyway for future-proofing

### Missing Detection
If large queries aren't detected:
1. Check query pattern matches `SUPABASE_IN_PATTERNS`
2. Verify file is in scan patterns (`src/**/*.js`, `api/**/*.js`)
3. Update detection patterns if needed

### Performance
For large codebases, consider:
- Limiting scan patterns to specific directories
- Running only on changed files in CI
- Caching results for incremental builds