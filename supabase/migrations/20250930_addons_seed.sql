-- ============================================================================
-- Love & Photos - Add-Ons Catalog Seed Data
-- Migration: 20250930_addons_seed
--
-- Populates the addons table with initial product catalog
-- ============================================================================

-- Insert add-on products
INSERT INTO public.addons (code, name, description, price_cents, kind, display_order, icon_name, metadata) VALUES

-- ============================================================================
-- EXTRA HOURS (kind = 'hour')
-- ============================================================================
(
    'extra_hour',
    'Extra Hour',
    'Additional hour of photography coverage beyond your package. Perfect for extended receptions or additional venue locations.',
    20000, -- $200.00
    'hour',
    1,
    'Clock',
    '{"unit": "hour", "max_quantity": 5}'::jsonb
),

(
    'extra_2_hours',
    'Extra 2 Hours',
    'Two additional hours of photography coverage. Great for full-day events or multi-location shoots.',
    38000, -- $380.00 (5% discount)
    'hour',
    2,
    'Clock',
    '{"unit": "hours", "hours": 2, "discount_percent": 5}'::jsonb
),

-- ============================================================================
-- ADDITIONAL SERVICES (kind = 'addon')
-- ============================================================================
(
    'second_shooter',
    'Second Shooter',
    'Add a second professional photographer for comprehensive coverage from multiple angles. Capture more moments simultaneously.',
    50000, -- $500.00
    'addon',
    10,
    'Users',
    '{"requires_advance_notice_days": 14}'::jsonb
),

(
    'engagement_session',
    'Engagement Session',
    'Pre-wedding engagement photo session at a location of your choice. 1-2 hours of coverage with 30+ edited photos.',
    40000, -- $400.00
    'addon',
    20,
    'Heart',
    '{"duration_hours": 1.5, "deliverables": "30+ edited photos", "location": "custom"}'::jsonb
),

(
    'rush_delivery',
    'Rush Delivery (2 Weeks)',
    'Expedited photo editing and delivery within 14 days instead of standard 4-6 weeks. Perfect for urgent needs.',
    30000, -- $300.00
    'addon',
    30,
    'Zap',
    '{"delivery_days": 14, "standard_delivery_days": 42}'::jsonb
),

(
    'raw_files',
    'RAW Files Package',
    'Receive all unedited RAW image files from your event on a USB drive. Includes 100% of captured photos in original quality.',
    25000, -- $250.00
    'addon',
    40,
    'HardDrive',
    '{"format": "RAW (CR2/NEF)", "delivery_method": "USB drive"}'::jsonb
),

(
    'photo_album',
    'Premium Photo Album',
    'Professionally designed 12x12" hardcover photo album with 30 spreads (60 pages). Museum-quality prints with lay-flat binding.',
    75000, -- $750.00
    'addon',
    50,
    'Book',
    '{"size": "12x12 inches", "pages": 60, "binding": "lay-flat hardcover"}'::jsonb
),

(
    'parent_albums',
    'Parent Albums (Set of 2)',
    'Two matching 8x8" hardcover albums for parents. Each includes 20 spreads with curated highlights from your event.',
    50000, -- $500.00 (for 2)
    'addon',
    60,
    'BookOpen',
    '{"quantity": 2, "size": "8x8 inches", "pages": 40}'::jsonb
),

(
    'videography_highlight',
    'Highlight Video (3-5 min)',
    'Cinematic highlight video capturing the best moments of your event. Professionally edited with music and color grading.',
    100000, -- $1,000.00
    'addon',
    70,
    'Video',
    '{"duration_minutes": "3-5", "includes": ["music", "color grading", "4K export"]}'::jsonb
),

(
    'drone_coverage',
    'Drone Aerial Footage',
    'Professional drone photography and videography for stunning aerial perspectives of your venue and ceremony.',
    40000, -- $400.00
    'addon',
    80,
    'Plane',
    '{"requires": "FAA certified pilot", "weather_dependent": true, "advance_notice_days": 7}'::jsonb
),

(
    'photo_booth_2hr',
    'Photo Booth (2 Hours)',
    'Interactive photo booth with unlimited prints, digital gallery, props, and on-site attendant for 2 hours.',
    60000, -- $600.00
    'addon',
    90,
    'Camera',
    '{"duration_hours": 2, "includes": ["unlimited prints", "digital gallery", "props", "attendant"]}'::jsonb
),

(
    'same_day_edit',
    'Same-Day Edit Video',
    'Watch a highlight video of your ceremony and cocktail hour during your reception. A memorable surprise for your guests!',
    150000, -- $1,500.00
    'addon',
    100,
    'Film',
    '{"delivery_time": "same day", "duration_minutes": "3-5", "requires_advance_notice_days": 21}'::jsonb
),

(
    'travel_fee_50mi',
    'Travel Fee (50-100 mi)',
    'Travel fee for events 50-100 miles from photographer''s home base. Covers transportation and travel time.',
    15000, -- $150.00
    'addon',
    110,
    'MapPin',
    '{"distance_range": "50-100 miles", "auto_apply": false}'::jsonb
),

(
    'travel_fee_100mi',
    'Travel Fee (100+ mi)',
    'Travel fee for events over 100 miles from photographer''s home base. Includes transportation, travel time, and accommodations if needed.',
    35000, -- $350.00
    'addon',
    120,
    'MapPin',
    '{"distance_range": "100+ miles", "may_include": "accommodations", "auto_apply": false}'::jsonb
);

-- ============================================================================
-- VERIFY SEED DATA
-- ============================================================================

DO $$
DECLARE
    addon_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO addon_count FROM public.addons;
    RAISE NOTICE 'Seeded % add-on products', addon_count;

    RAISE NOTICE 'Add-ons by kind:';
    RAISE NOTICE '  - Hours: %', (SELECT COUNT(*) FROM public.addons WHERE kind = 'hour');
    RAISE NOTICE '  - Add-ons: %', (SELECT COUNT(*) FROM public.addons WHERE kind = 'addon');

    IF addon_count = 0 THEN
        RAISE EXCEPTION 'Seed data insertion failed - no addons found';
    END IF;
END $$;

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================

-- Log success
SELECT 'Add-ons catalog seeded successfully' AS status;