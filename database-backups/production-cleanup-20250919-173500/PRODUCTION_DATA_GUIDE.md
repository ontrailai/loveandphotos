# PRODUCTION DATA GUIDE
**Love & Photos - Clean Database Ready for Real Content**

## 🎯 Current State
- **Database**: Completely cleaned of all test/demo data
- **Users**: Only 4 development team accounts remain
- **System Config**: Preserved (pricing tiers, training modules, location data)
- **Frontend**: All empty states tested and working properly

---

## 📊 PRESERVED SYSTEM DATA

### Pay Tiers (4 entries) ✅
```sql
-- Bronze: $150/hr, #CD7F32
-- Silver: $225/hr, #C0C0C0  
-- Gold: $350/hr, #FFD700
-- Platinum: $500/hr, #E5E4E2
```

### Training Modules (5 entries) ✅
```sql
-- Platform Overview (Onboarding, Required)
-- Professional Photography Standards (Technical, Required)
-- Client Communication (Soft Skills, Required)
-- Contract and Legal (Legal, Required)
-- Equipment Guidelines (Technical, Optional)
```

### Location Data (10 cities) ✅
```sql
-- Austin TX, Beverly Hills CA, Chicago IL, Denver CO, Miami FL
-- New York NY, Portland OR, San Diego CA, San Francisco CA, Seattle WA
```

---

## 📝 SAMPLE DATA FORMATS

### 1. Real Photographer Registration
When photographers sign up, they'll create:

**User Account:**
```sql
INSERT INTO users (id, email, full_name, role) VALUES 
(uuid_generate_v4(), 'photographer@email.com', 'Jane Smith', 'photographer');
```

**Photographer Profile:**
```sql
INSERT INTO photographers (
  user_id, 
  bio, 
  specialties, 
  languages, 
  years_experience,
  location_city,
  location_state,
  is_available,
  is_verified
) VALUES (
  '{user_id}',
  'Professional wedding and portrait photographer with 8 years of experience...',
  ARRAY['Wedding', 'Portrait', 'Event'],
  ARRAY['English', 'Spanish'],
  8,
  'Austin',
  'TX',
  true,
  false  -- Admin will verify manually
);
```

### 2. Portfolio Items
```sql
INSERT INTO portfolio_items (
  photographer_id,
  image_url,
  title,
  description,
  category,
  is_featured
) VALUES (
  '{photographer_id}',
  'https://your-cdn.com/portfolio/image1.jpg',
  'Sunset Wedding Ceremony',
  'Beautiful outdoor ceremony at Zilker Park',
  'wedding',
  true
);
```

### 3. Photography Packages
```sql
INSERT INTO packages (
  photographer_id,
  name,
  description,
  base_price,
  duration_hours,
  included_photos,
  includes_video,
  max_locations
) VALUES (
  '{photographer_id}',
  'Wedding Essential',
  'Complete wedding day coverage with edited photos',
  1500.00,
  8,
  300,
  false,
  2
);
```

### 4. Availability Calendar
```sql
INSERT INTO availability (
  photographer_id,
  date,
  start_time,
  end_time,
  is_available,
  booking_type
) VALUES (
  '{photographer_id}',
  '2025-10-15',
  '09:00:00',
  '18:00:00',
  true,
  'full_day'
);
```

### 5. Customer Bookings
```sql
INSERT INTO bookings (
  customer_id,
  photographer_id,
  event_date,
  event_time,
  event_end_time,
  event_type,
  venue_name,
  venue_address,
  booking_status,
  payment_status,
  total_amount,
  guest_count
) VALUES (
  '{customer_id}',
  '{photographer_id}',
  '2025-11-20',
  '14:00:00',
  '22:00:00',
  'wedding',
  'Four Seasons Hotel',
  '{"address": "98 San Jacinto Blvd", "city": "Austin", "state": "TX", "zip": "78701"}'::jsonb,
  'confirmed',
  'paid',
  2500.00,
  120
);
```

### 6. Customer Reviews
```sql
INSERT INTO reviews (
  booking_id,
  customer_id,
  photographer_id,
  rating,
  comment,
  is_verified
) VALUES (
  '{booking_id}',
  '{customer_id}',
  '{photographer_id}',
  5,
  'Amazing photographer! Captured every special moment beautifully.',
  true
);
```

---

## 🚀 ADDING REAL PHOTOGRAPHERS

### Option 1: Manual Admin Interface
1. Go to `/admin/photographers` (requires admin login)
2. Use the admin panel to approve and manage photographers
3. Set LNP Choice status for premium photographers

### Option 2: Direct Database Insert
```sql
-- Step 1: Create user account
INSERT INTO users (id, email, full_name, phone, role) VALUES 
(uuid_generate_v4(), 'john@photosbyjohn.com', 'John Photographer', '512-555-0123', 'photographer');

-- Step 2: Create photographer profile  
INSERT INTO photographers (user_id, bio, specialties, languages, years_experience, location_city, location_state, is_available, is_verified) 
VALUES (
  (SELECT id FROM users WHERE email = 'john@photosbyjohn.com'),
  'Award-winning wedding photographer serving Austin and surrounding areas...',
  ARRAY['Wedding', 'Engagement', 'Portrait'],
  ARRAY['English'],
  10,
  'Austin',
  'TX', 
  true,
  true
);
```

### Option 3: Import CSV/JSON
Use the existing seeder scripts as templates:
- `/supabase-data-tasks/scripts/` contains import examples
- Modify for real data instead of generated content

---

## ⚠️ IMPORTANT PRODUCTION NOTES

### Supabase Storage Setup
Configure image storage buckets:
```sql
-- Portfolio images bucket
-- Profile avatars bucket  
-- Event photos bucket
```

### RLS Policies
All security policies are in place:
- Users can only modify their own data
- Photographers can only access their bookings
- Admins have full access

### Environment Variables
Ensure production environment has:
```env
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-key
VITE_STRIPE_PUBLIC_KEY=your-production-stripe-key
```

### Performance Optimization
- All database indexes are in place
- Image URLs should use CDN
- Consider enabling Supabase caching

---

## 🔧 MAINTENANCE COMMANDS

### Check Empty State
```sql
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'photographer') as photographers,
  (SELECT COUNT(*) FROM bookings) as bookings,
  (SELECT COUNT(*) FROM reviews) as reviews,
  (SELECT COUNT(*) FROM portfolio_items) as portfolio_items;
```

### Verify System Data
```sql
SELECT COUNT(*) as pay_tiers FROM pay_tiers;      -- Should be 4
SELECT COUNT(*) as training FROM training_modules; -- Should be 5  
SELECT COUNT(*) as cities FROM zip_city;          -- Should be 10
```

---

## 📞 SUPPORT

For technical support with data import:
- **Development Team**: Riley Pasha (rileympasha@gmail.com)
- **Technical Lead**: Ryan Watson (rw.ontrail@gmail.com)

**Database is production-ready as of 2025-09-19 17:35:00** ✅