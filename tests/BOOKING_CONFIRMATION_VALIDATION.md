# Booking Confirmation Card - QA Validation Checklist

## Test Date: TBD
## Tester: TBD

---

## 📋 Overview

This document validates that the Booking Confirmation Card displays all fields correctly across all client-facing views after the fixes implemented on 2025-10-06.

### Files Modified:
1. ✅ `/src/components/dashboard/redesign/UpcomingBookingCard.jsx` - Fixed location, time, price
2. ✅ `/src/pages/customer/BookingConfirmation.jsx` - Fixed time and price formatting
3. ✅ `/src/lib/utils/priceFormatting.js` - Created shared formatting utilities
4. ✅ `/src/pages/customer/Dashboard.jsx` - Already has complete query with `*`

### Data Source:
- **Single Source of Truth**: Supabase `bookings` table
- **Query Type**: `select('*')` fetches all fields including `location_city`, `location_state`, `venue_name`, `venue_address`, `final_price`, `total_amount`, `event_time`

---

## 🎯 Test Scenarios

### Scenario 1: Standard Booking with All Fields
**Booking Details:**
- Package: 2-Hour Photoshoot
- Location: `location_city` = "Los Angeles", `location_state` = "CA"
- Event Date: Future date
- Event Time: "14:30:00" (should display "2:30 PM")
- Price: `final_price` = 800.00
- Add-ons: None

**Expected Results:**
- [ ] Location displays: "Los Angeles, CA"
- [ ] Time displays: "2:30 PM"
- [ ] Price displays: "$800.00" in bold red
- [ ] Package name displays: "2 Hour Photoshoot"
- [ ] Photographer first name only displays
- [ ] All fields visible on mobile and desktop

**Test Locations:**
- [ ] Booking Confirmation Page (`/booking/confirmation`)
- [ ] Customer Dashboard (`/dashboard`)
- [ ] Booking Details Page (`/booking/:id`)

---

### Scenario 2: Booking with Add-Ons and Video Coverage
**Booking Details:**
- Package: Engagement Session
- Location: `location_city` = "San Francisco", `location_state` = "CA"
- Event Date: Future date
- Event Time: "10:00:00" (should display "10:00 AM")
- Base Price: $600
- Add-ons: Second Shooter (+$200), Extra Hour (+$150)
- Video Coverage: +50% multiplier
- Final Price: `final_price` = 1425.00

**Expected Results:**
- [ ] Location displays: "San Francisco, CA"
- [ ] Time displays: "10:00 AM"
- [ ] Price displays: "$1,425.00" (properly calculated with add-ons and multipliers)
- [ ] Add-ons listed or displayed in tooltip/modal
- [ ] Total reflects all adjustments

**Test Locations:**
- [ ] Booking Confirmation Page
- [ ] Customer Dashboard
- [ ] Payment Summary section shows correct breakdown

---

### Scenario 3: Empty Location Fallback
**Booking Details:**
- Package: 1-Hour Session
- Location: `location_city` = null, `location_state` = null, `venue_name` = null
- Event Date: Future date
- Event Time: null
- Price: `total_amount` = 400.00

**Expected Results:**
- [ ] Location displays: "TBD"
- [ ] Time displays: "TBD"
- [ ] Price displays: "$400.00"
- [ ] No broken/undefined values appear
- [ ] Fallback text is clean and professional

**Test Locations:**
- [ ] All booking views handle empty data gracefully

---

### Scenario 4: Legacy Data with `venue_name` Only
**Booking Details:**
- Package: Bridal Session
- Location: `location_city` = null, `venue_name` = "Golden Gate Park"
- Event Date: Future date
- Event Time: "15:45:00" (should display "3:45 PM")
- Price: `base_price` = 950.00

**Expected Results:**
- [ ] Location displays: "Golden Gate Park"
- [ ] Time displays: "3:45 PM"
- [ ] Price displays: "$950.00"
- [ ] Cascading fallback works correctly (uses `venue_name` when `location_city` is null)

---

### Scenario 5: Location with `venue_address` JSON Object
**Booking Details:**
- Package: Wedding Package
- Location: `location_city` = null, `venue_address` = `{"street": "123 Main St", "city": "Berkeley", "state": "CA", "zip": "94704"}`
- Event Date: Future date
- Event Time: "11:00:00"
- Price: `final_price` = 2500.00

**Expected Results:**
- [ ] Location displays: "Berkeley, CA"
- [ ] Full address shown in details section if needed
- [ ] Proper fallback chain: `location_city` → `venue_name` → `venue_address` → "TBD"

---

### Scenario 6: Mobile Responsive Layout
**Device**: iPhone 13 (390x844), iPad (768x1024)

**Expected Results:**
- [ ] All fields readable on small screens
- [ ] Price prominently displayed
- [ ] Location doesn't overflow
- [ ] Time format consistent
- [ ] Cards stack properly
- [ ] Touch targets adequate size

---

### Scenario 7: Edge Cases

#### 7a: Zero Price
- Price: `final_price` = 0
- **Expected**: "$0.00" (not blank or "null")

#### 7b: Very Large Price
- Price: `final_price` = 15000.75
- **Expected**: "$15,000.75" with proper comma formatting

#### 7c: Invalid Time
- Event Time: "invalid"
- **Expected**: "TBD" (error handled gracefully)

#### 7d: Future Date Far in Advance
- Event Date: 2 years from now
- **Expected**: Countdown timer shows correct days remaining

#### 7e: No Photographer Assigned
- Photographer: null
- **Expected**: "Photographer" fallback text

---

## ✅ Acceptance Criteria

### Must Pass All:
- [ ] **Location Field**: Displays `location_city, location_state` or cascades to fallback ("TBD")
- [ ] **Time Field**: Displays in 12-hour format with AM/PM or "TBD"
- [ ] **Price Field**: Formatted as USD currency (`$X,XXX.XX`) in bold red
- [ ] **Package Name**: Displays correctly from `packages.title`
- [ ] **Photographer Name**: First name only (privacy)
- [ ] **Single Source of Truth**: All data from Supabase `bookings` table
- [ ] **No Stale/Malformed Data**: No `undefined`, `null`, `00:00:00`, or placeholder values displayed
- [ ] **Mobile Responsive**: Clean layout on all device sizes
- [ ] **Edge Cases Handled**: Graceful fallbacks for missing/invalid data
- [ ] **Payment Status**: Correctly shows paid/pending/failed
- [ ] **Contract Status**: Shows signed/unsigned status

---

## 🚨 Known Issues / Blockers

*(Document any issues discovered during testing)*

---

## 📝 Test Results Summary

**Date Tested**: _______________
**Tester Name**: _______________
**Environment**: ☐ Local ☐ Staging ☐ Production

**Overall Status**: ☐ PASS ☐ FAIL ☐ CONDITIONAL PASS

**Notes**:
-
-
-

---

## 🔧 Developer Notes

### Price Calculation Logic:
```javascript
// Priority: final_price > total_amount > base_price > 0
const price = booking.final_price || booking.total_amount || booking.base_price || 0
```

### Location Cascade Logic:
```javascript
// Priority: location_city+state > venue_name > venue_address > TBD
const location = booking.location_city && booking.location_state
  ? `${booking.location_city}, ${booking.location_state}`
  : booking.venue_name ||
    (booking.venue_address?.city && booking.venue_address?.state
      ? `${booking.venue_address.city}, ${booking.venue_address.state}`
      : 'TBD')
```

### Time Formatting:
```javascript
// Convert "14:30:00" → "2:30 PM"
const formattedTime = booking.event_time
  ? new Date(`2000-01-01T${booking.event_time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  : 'TBD'
```

---

## 📚 Related Documentation

- **Database Schema**: `/supabase/migrations/` - `bookings` table structure
- **Privacy Utils**: `/src/lib/privacy/sanitizeTalentData.js` - First name extraction
- **Price Utils**: `/src/lib/utils/priceFormatting.js` - Shared formatting functions
- **Components**: `/src/components/dashboard/redesign/` - Booking cards
