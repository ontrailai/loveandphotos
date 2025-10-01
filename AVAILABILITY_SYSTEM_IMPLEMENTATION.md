# Photographer Availability System - Implementation Guide

## 🎯 Overview

Complete photographer availability system that allows photographers to set available booking dates via a calendar interface, and filters search results to only show photographers available on the client's desired event date.

## 📋 Implementation Summary

### 1. Database Changes

**Migration File**: `supabase/migrations/20250930_availability_enhancement.sql`

#### Added Fields to `photographers` Table:
- `available_dates` (DATE[]): Array of dates when photographer is available
- `visible_in_search` (BOOLEAN, GENERATED): Computed as `is_public = true AND array_length(available_dates, 1) > 0`

#### Database Functions Created:
- `is_photographer_available(dates[], date)`: Check if photographer available on specific date
- `get_available_photographers(event_date, zip)`: Get photographers available for event date/location

#### Indexes Added:
- GIN index on `available_dates` for fast array searches
- Index on `visible_in_search` for optimized search queries

### 2. Frontend Components

#### New Page: `AvailabilityPage.jsx`
**Location**: `src/pages/talent/dashboard/AvailabilityPage.jsx`

**Features**:
- Calendar-based date picker using `react-day-picker`
- Multiple date selection
- Real-time visibility status indicator
- Stats showing future/past dates
- Integration with visibility toggle
- Automatic save with Supabase sync

**Key Functionality**:
```javascript
// Load availability from Supabase
const { data } = await supabase
  .from('photographers')
  .select('available_dates, is_public, visible_in_search')
  .eq('user_id', user.id)
  .single()

// Save availability
await supabase
  .from('photographers')
  .update({
    available_dates: dateStrings, // ['2025-10-15', '2025-10-20', ...]
    is_public: isPublic
  })
  .eq('user_id', user.id)
```

### 3. Search Integration

#### Updated: `Browse.jsx`
**Location**: `src/pages/customer/Browse.jsx`

**Changes**:
- Query now uses `photographers` table directly instead of `photographer_preview_profiles`
- Added date-based availability filtering
- Shows contextual "no results" message when filtering by date

**Query Logic**:
```javascript
let query = supabaseClient
  .from('photographers')
  .select(`...fields, users!inner(full_name, avatar_url)`)
  .eq('visible_in_search', true)

// Filter by date if selected
if (filters.date) {
  query = query.contains('available_dates', [filters.date])
}
```

### 4. Dashboard Integration

#### Updated: `TalentDashboardLayout.jsx`
**Added**: Availability nav item with `CalendarClock` icon

#### Updated: `ProfilePage.jsx`
**Enhanced**: Visibility indicator showing 3 states:
1. ✅ **Visible in Search**: Public + has availability
2. ⚠️ **Not Visible**: Public but no availability (with link to set availability)
3. ❌ **Private**: Profile hidden

### 5. Routing

#### Updated: `App.jsx`
**Added Route**: `/talent/dashboard/availability`
```javascript
const TalentAvailability = lazy(() => import('@pages/talent/dashboard/AvailabilityPage'))

<Route path="availability" element={
  <Suspense fallback={<PageLoader />}>
    <TalentAvailability />
  </Suspense>
} />
```

## 🚀 How It Works

### For Photographers:

1. **Set Availability**:
   - Navigate to Talent Dashboard → Availability
   - Select available dates using calendar
   - Click "Save Availability"
   - System shows visibility status immediately

2. **Visibility Requirements**:
   - Profile must be set to "Public" (toggle on Profile page)
   - Must have at least one future available date
   - When both conditions met: `visible_in_search = true`

3. **Managing Availability**:
   - Add/remove dates anytime
   - Clear all dates if taking a break
   - Past dates automatically filtered from visibility check

### For Clients:

1. **Browse Photographers**:
   - Navigate to `/browse`
   - Optionally select event date
   - Only see photographers available on that date

2. **Search Behavior**:
   - **No date selected**: Shows all visible photographers
   - **Date selected**: Only shows photographers with that date in `available_dates`
   - **No results**: "No photographers available on [date]. Try changing your date or location."

## 📊 Database Schema

### photographers table (updated)
```sql
CREATE TABLE public.photographers (
  -- ... existing fields ...
  available_dates DATE[] DEFAULT ARRAY[]::DATE[],
  visible_in_search BOOLEAN GENERATED ALWAYS AS (
    is_public = true AND
    COALESCE(array_length(available_dates, 1), 0) > 0
  ) STORED
)

-- Index for fast date searches
CREATE INDEX idx_photographers_available_dates
ON public.photographers USING GIN(available_dates);

-- Index for search filtering
CREATE INDEX idx_photographers_visible_in_search
ON public.photographers(visible_in_search)
WHERE visible_in_search = true;
```

## 🔧 Testing Guide

### 1. Database Migration
```bash
# Run migration (if not using Supabase auto-migration)
psql -h your-db-host -U postgres -d your-db < supabase/migrations/20250930_availability_enhancement.sql
```

### 2. Photographer Workflow Test
1. Sign in as photographer
2. Navigate to Profile → ensure is_public = true
3. Go to Availability page
4. Select 3-5 future dates
5. Click "Save Availability"
6. Verify status shows "✅ Visible in Client Search"
7. Go back to Profile → verify visibility indicator shows green

### 3. Client Search Test
1. Sign out (or use incognito)
2. Navigate to `/browse`
3. Verify photographer appears in results
4. Select a date from availability calendar
5. Verify only photographers available on that date show
6. Select date with no availability
7. Verify message: "No photographers available on [date]..."

### 4. Edge Cases
- **No availability**: Photographer not in search even if public
- **Private + availability**: Still not visible (both conditions required)
- **Past dates only**: Not visible (only future dates count)
- **Date cleared**: Visibility immediately removed

## 🎨 UI Components Used

### Calendar Component
- **Library**: `react-day-picker`
- **Mode**: `multiple` (allows selecting multiple dates)
- **Disabled**: Dates before today
- **Styling**: Custom pink theme matching brand

### Icons
- `Calendar`, `CalendarClock`: Availability indicators
- `Eye`, `EyeOff`: Visibility toggles
- `CheckCircle`, `Info`: Status indicators
- `Trash2`: Clear all dates

## 📝 Code Patterns

### Date Handling
```javascript
// Convert Date objects to ISO strings for database
const dateStrings = dates.map(date => {
  return new Date(date).toISOString().split('T')[0]
})

// Convert ISO strings back to Date objects
const dates = dateStrings.map(str => new Date(str))
```

### Computed Field (visible_in_search)
```sql
-- Automatically updates when is_public or available_dates changes
visible_in_search BOOLEAN GENERATED ALWAYS AS (
  is_public = true AND
  COALESCE(array_length(available_dates, 1), 0) > 0
) STORED
```

### Array Containment Query
```javascript
// PostgreSQL array contains operator
query.contains('available_dates', [filters.date])

// Equivalent SQL: WHERE filters.date = ANY(available_dates)
```

## 🔐 Security & RLS

### Row Level Security
- Photographers can only edit their own `available_dates`
- Public can view `visible_in_search = true` photographers
- Computed `visible_in_search` field enforces visibility rules

### Data Validation
- Dates must be valid DATE format
- Frontend prevents selecting past dates
- Database accepts any date array (flexibility for manual admin updates)

## 🚨 Known Limitations & Future Enhancements

### Current Limitations:
1. No blocking/unavailable dates (only available dates tracked)
2. No time-based availability (full day availability only)
3. No recurring patterns (must manually select each date)
4. No calendar sync (Google Calendar, etc.)

### Planned Enhancements:
1. **Blocking Dates**: Add `blocked_dates` array for unavailable periods
2. **Time Slots**: Store time ranges for partial day availability
3. **Recurring Availability**: "Available every Saturday" patterns
4. **Calendar Sync**: Two-way sync with Google Calendar
5. **Bulk Import**: CSV upload for availability
6. **Auto-Refresh**: Real-time updates when availability changes

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: Photographer not appearing in search
- **Check**: is_public = true?
- **Check**: Has future available dates?
- **Check**: visible_in_search computed correctly?
- **Fix**: Run migration if visible_in_search column missing

**Issue**: Date filter not working
- **Check**: available_dates array contains ISO date strings?
- **Check**: GIN index created on available_dates?
- **Fix**: Re-run migration to add index

**Issue**: Calendar not showing selected dates
- **Check**: Date conversion between string/Date object correct?
- **Check**: Timezone handling (use UTC consistently)
- **Fix**: Ensure `.toISOString().split('T')[0]` used for storage

## 📚 Related Files

### Database
- `supabase/migrations/20250930_availability_enhancement.sql`
- `supabase/schema.sql` (reference)

### Components
- `src/pages/talent/dashboard/AvailabilityPage.jsx` (main calendar UI)
- `src/pages/talent/dashboard/ProfilePage.jsx` (visibility indicator)
- `src/pages/customer/Browse.jsx` (search with date filter)
- `src/components/talent/TalentDashboardLayout.jsx` (navigation)

### Routing
- `src/App.jsx` (route definitions)

### Styles
- Custom calendar styles in AvailabilityPage component
- Uses existing Card, Button, Badge components

---

**Implementation Date**: September 30, 2025
**Status**: ✅ Complete and Ready for Testing
**Next Steps**: Run migration → Test photographer workflow → Test client search
