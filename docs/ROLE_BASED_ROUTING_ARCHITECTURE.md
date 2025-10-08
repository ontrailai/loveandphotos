# Role-Based Routing Architecture - Love & Photos

## ✅ System Status: FULLY IMPLEMENTED

The role-based routing system for photographers vs videographers is **already working correctly** for all new signups. This document explains the architecture.

---

## Architecture Overview

### 1. Application Flow (TalentApplication.jsx)

**Location**: `/src/pages/TalentApplication.jsx`

**How It Works**:
- User selects role: 'photographer' or 'videographer' (line 13, line 113-116)
- Role-specific questions are shown based on selection (lines 60-68 for videographers)
- On submission, role is stored in `talent_applications` table (line 207)
- **CRITICAL**: Line 272 passes `isVideographer: selectedRole === 'videographer'` to `signUp()`

### 2. Auth Context - Signup (AuthContext.jsx)

**Location**: `/src/contexts/AuthContext.jsx`

**How It Works** (lines 315-441):
1. `signUp()` receives `isVideographer` parameter (line 317)
2. Creates auth user in Supabase (lines 320-325)
3. Creates profile in `users` table with role='photographer' (lines 339-355)
4. **Creates photographer profile with `is_videographer` flag** (line 368):
   ```javascript
   .upsert({
     user_id: data.user.id,
     is_videographer: isVideographer,  // ✅ Videographer flag set here
     profile_complete: false,
     is_public: true
   })
   ```
5. Auto-signs in the user (lines 413-430)

### 3. Auth Context - Login Routing (AuthContext.jsx)

**Location**: `/src/contexts/AuthContext.jsx`

**How It Works** (lines 529-548):
```javascript
if (userProfile.role === 'photographer') {
  // Fetch photographer profile to check is_videographer
  const photographerData = await db.photographers.getProfile(data.user.id)

  if (photographerData?.is_videographer) {
    // ✅ Route videographer to videographer dashboard
    navigate('/talent/dashboard/videographer', { replace: true })
  } else {
    // ✅ Route photographer to photographer dashboard
    navigate('/talent/dashboard', { replace: true })
  }
}
```

### 4. Routes (App.jsx)

**Location**: `/src/App.jsx`

**Configured Routes**:
- `/talent/dashboard` → Photographer Dashboard (default)
- `/talent/dashboard/videographer` → Videographer Dashboard (VideographerProfilePage)

---

## Database Schema

### `photographers` Table
```sql
-- Key field for role differentiation
is_videographer BOOLEAN DEFAULT FALSE

-- Gear checklist fields (videographers only)
gear_has_camera BOOLEAN DEFAULT FALSE
gear_has_lenses BOOLEAN DEFAULT FALSE
gear_has_tripod BOOLEAN DEFAULT FALSE
gear_has_gimbal BOOLEAN DEFAULT FALSE
gear_has_drone BOOLEAN DEFAULT FALSE
gear_has_audio_recorder BOOLEAN DEFAULT FALSE
gear_has_lighting BOOLEAN DEFAULT FALSE

-- Profile completion
profile_complete BOOLEAN DEFAULT FALSE  -- Different requirements for videographers
```

### `talent_applications` Table
```sql
role TEXT CHECK (role IN ('photographer', 'videographer'))
answers JSONB  -- Contains role-specific application answers
```

---

## UI Differences

### Photographer Dashboard
**Route**: `/talent/dashboard`
**Features**:
- Portfolio image upload (required for profile completion)
- Photo-specific style tags
- "Photographer Dashboard" branding
- Pink/rose accent colors

### Videographer Dashboard
**Route**: `/talent/dashboard/videographer`
**Features**:
- Gear checklist (replaces portfolio upload)
- Video-specific style tags
- "🎥 Videographer Studio" branding
- Blue accent colors (text-blue-400, bg-blue-500/20)
- Dark gradient theme

---

## Profile Completion Requirements

### Photographers
- ✅ Profile Photo
- ✅ Bio (500+ chars)
- ✅ Gender
- ✅ Experience Years
- ✅ Photography Styles
- ✅ **Portfolio Images (1+ image)**
- ✅ Location (City/State/ZIP)
- ✅ Languages

### Videographers
- ✅ Profile Photo
- ✅ Bio (500+ chars)
- ✅ Gender
- ✅ Experience Years
- ✅ Video Styles
- ✅ **Gear Setup (1+ items)** ← Different from photographers
- ✅ Location (City/State/ZIP)
- ✅ Languages

---

## Testing Checklist

### New Photographer Signup
1. Go to `/apply`
2. Select "Photographer"
3. Fill out application with all "Yes" answers
4. Submit
5. **Expected**: Redirect to `/talent/dashboard`
6. **Expected**: See portfolio upload UI
7. **Expected**: Pink/rose branding

### New Videographer Signup
1. Go to `/apply`
2. Select "Videographer"
3. Fill out application with all "Yes" answers (including "Do you have gear to record sound?")
4. Submit
5. **Expected**: Redirect to `/talent/dashboard/videographer`
6. **Expected**: See gear checklist UI (NO portfolio upload)
7. **Expected**: Blue accent colors and "Videographer Studio" branding

### Login Flow
1. Login as photographer
2. **Expected**: Auto-routed to `/talent/dashboard`
3. Logout
4. Login as videographer
5. **Expected**: Auto-routed to `/talent/dashboard/videographer`

---

## Helper SQL for Manual Role Updates

If you need to manually convert an existing photographer to a videographer (or vice versa):

```sql
-- Convert photographer to videographer
UPDATE photographers
SET is_videographer = TRUE,
    profile_complete = FALSE  -- Will need to complete gear checklist
WHERE user_id = '[USER_ID_HERE]';

-- Convert videographer back to photographer
UPDATE photographers
SET is_videographer = FALSE,
    profile_complete = FALSE  -- Will need to upload portfolio images
WHERE user_id = '[USER_ID_HERE]';
```

**Note**: Profile completion status is reset because the requirements differ.

---

## Key Files Reference

### Frontend
- **Application Form**: `/src/pages/TalentApplication.jsx`
- **Auth Logic**: `/src/contexts/AuthContext.jsx`
- **Photographer Dashboard**: `/src/pages/talent/dashboard/ProfilePage.jsx`
- **Videographer Dashboard**: `/src/pages/talent/dashboard/videographer/VideographerProfilePage.jsx`
- **Routes**: `/src/App.jsx`

### Database
- **Users**: `public.users` (role field)
- **Talent Profiles**: `public.photographers` (is_videographer, gear fields)
- **Applications**: `public.talent_applications` (role, answers)

---

## Common Issues & Solutions

### Issue: User is routed to wrong dashboard
**Solution**: Check `photographers.is_videographer` field in database. Update using SQL above if needed.

### Issue: Profile completion not working for videographer
**Solution**: Videographers need gear checklist (NOT portfolio images). Check that at least 1 gear item is selected.

### Issue: Login redirects to default `/talent/dashboard` for videographers
**Solution**: Ensure `photographers.is_videographer = TRUE` in database. The routing logic at `AuthContext.jsx:533-543` checks this field.

---

## Summary

✅ **The system is fully functional and correctly implemented.**
✅ New photographers → photographer dashboard
✅ New videographers → videographer dashboard
✅ Routing logic checks `is_videographer` flag
✅ Different UI/UX for each role
✅ Different profile completion requirements

**No additional coding is required.** The architecture is production-ready.
