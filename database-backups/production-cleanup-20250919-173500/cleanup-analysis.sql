-- PRODUCTION CLEANUP ANALYSIS
-- Generated: 2025-09-19 17:35:00

-- PRESERVE THESE USERS (Real development team):
-- b508d330-e320-45bb-a0c9-954505a52d85 | rileympasha@gmail.com | Riley Pasha | customer
-- 7a55d655-a7ab-4f30-a6f2-e2f4177e98d0 | info@tryacre.io | Riley Pasha | customer  
-- 7181c051-5bd3-4722-bf6c-5b962a0d37d5 | xits@gmail.com | Riley Pasha | customer
-- d93c4ab8-ec61-4f44-b5e6-434843f77c59 | rw.ontrail@gmail.com | Ryan Watson | customer

-- DELETE USERS:
-- 308 obvious test users (@example.com, test/demo names)
-- 1,069 bulk-seeded photographers (created 2025-09-13 21:36:20.358207+00)
-- Total to delete: ~1,377 users

-- PRESERVE SYSTEM DATA:
-- pay_tiers (4 rows) - Bronze/Silver/Gold/Platinum pricing
-- training_modules (5 rows) - Photographer onboarding content
-- zip_city (10 rows) - Location reference data

-- DELETE ALL ASSOCIATED DATA:
-- photographers table (1,075 rows) - All demo photographers
-- photographer_preview_profiles (1,070 rows) - All preview profiles
-- bookings (385 rows) - All test bookings
-- reviews (203 rows) - All demo reviews
-- portfolio_items (5,993 rows) - All demo portfolio content
-- availability (5,979 rows) - All demo availability
-- packages (594 rows) - All demo packages
-- messages (679 rows) - All test messages
-- job_queue (81 rows) - All queued jobs
-- contact_submissions (2 rows) - Test contact forms

-- FINAL STATE:
-- Only 4 real users remain (development team)
-- System configuration preserved (pay_tiers, training_modules, zip_city)
-- Clean empty state ready for production content