# Stripe Webhook Setup Guide

## Problem Statement

After completing payment with a test Stripe card, bookings remain in `pending` status instead of being updated to `paid` by the webhook. This prevents them from appearing on the customer dashboard.

## Root Cause

**Stripe webhooks require a publicly accessible URL.** Your local development server at `http://localhost:10000` cannot be reached by Stripe's servers. Additionally, the `.env` file is missing the `STRIPE_WEBHOOK_SECRET` environment variable.

## Solutions

### Option 1: Stripe CLI (Recommended for Development)

The Stripe CLI creates a secure tunnel from Stripe to your local development server.

#### Installation

```bash
# macOS (via Homebrew)
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

#### Setup

1. **Login to Stripe:**
   ```bash
   stripe login
   ```
   This will open your browser to authenticate with your Stripe account.

2. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to http://localhost:10000/api/stripe/webhook
   ```

3. **Copy the webhook signing secret:**
   The command will output something like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

4. **Add the secret to your `.env` file:**
   ```bash
   # Add this line to your .env file
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

5. **Restart your API server:**
   ```bash
   npm run dev:api
   ```

#### Testing

Make a test payment and watch the Stripe CLI output. You should see:
```
2025-10-15 22:45:53  --> checkout.session.completed
2025-10-15 22:45:53  --> payment_intent.succeeded
```

Your API logs should show:
```
Processing checkout.session.completed: cs_test_xxxxx
Booking 4e4b3861-3ce1-4fb0-927c-4268318d41ae marked as paid successfully
```

### Option 2: ngrok (Alternative)

ngrok creates a public URL that tunnels to your local server.

#### Installation

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Setup

1. **Start ngrok:**
   ```bash
   ngrok http 10000
   ```

2. **Copy the forwarding URL:**
   ```
   Forwarding   https://abc123.ngrok.io -> http://localhost:10000
   ```

3. **Configure webhook in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Enter: `https://abc123.ngrok.io/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Click "Add endpoint"

4. **Copy the signing secret and add to `.env`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

5. **Restart your API server:**
   ```bash
   npm run dev:api
   ```

### Option 3: localhost.run (No Installation)

localhost.run provides temporary public URLs without requiring installation.

#### Setup

```bash
# Create a tunnel
ssh -R 80:localhost:10000 nokey@localhost.run
```

Then follow the same steps as ngrok to configure the webhook in Stripe Dashboard.

## Production Setup

For production deployment (e.g., on Render):

1. **Get your production URL:**
   ```
   https://your-app.onrender.com
   ```

2. **Configure webhook in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/webhooks (LIVE mode, not test)
   - Click "Add endpoint"
   - Enter: `https://your-app.onrender.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `checkout.session.expired`, `payment_intent.payment_failed`

3. **Add the signing secret to your production environment:**
   - In Render dashboard → Environment → Add environment variable
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_xxxxxxxxxxxxx` (from Stripe webhook endpoint)

4. **Verify webhook is working:**
   - Make a test payment in production
   - Check Stripe Dashboard → Webhooks → Recent events
   - Check your API logs in Render

## Temporary Workaround (Development Only)

For testing the dashboard without webhook setup, you can manually mark bookings as paid:

```sql
-- Run in Supabase SQL Editor
UPDATE bookings
SET
  payment_status = 'paid',
  booking_status = 'confirmed',
  updated_at = NOW()
WHERE id = 'YOUR_BOOKING_ID_HERE';
```

**⚠️ WARNING:** This is only for development testing. Do NOT use this in production!

## Verification Checklist

- [ ] Stripe CLI or ngrok is running
- [ ] `STRIPE_WEBHOOK_SECRET` is in `.env`
- [ ] API server has been restarted after adding the secret
- [ ] Test payment completes successfully
- [ ] Stripe CLI/Dashboard shows webhook events delivered
- [ ] API logs show "Processing checkout.session.completed"
- [ ] API logs show "Booking X marked as paid successfully"
- [ ] Booking appears on customer dashboard with `payment_status = 'paid'`

## Troubleshooting

### Webhook not receiving events

1. **Check Stripe CLI is running:**
   ```bash
   # Should show "Ready! Listening for events..."
   stripe listen --forward-to http://localhost:10000/api/stripe/webhook
   ```

2. **Check webhook secret is correct:**
   ```bash
   # In .env, should match the output from stripe listen
   echo $STRIPE_WEBHOOK_SECRET
   ```

3. **Check API server logs:**
   ```bash
   # Should see "Received Stripe webhook: checkout.session.completed"
   npm run dev:api
   ```

### Webhook signature verification failed

This means the `STRIPE_WEBHOOK_SECRET` doesn't match.

1. Stop `stripe listen`
2. Restart with `stripe listen --forward-to http://localhost:10000/api/stripe/webhook`
3. Copy the NEW signing secret
4. Update `.env` with the new secret
5. Restart API server

### Booking still showing as pending

1. **Check database directly:**
   ```sql
   SELECT id, payment_status, booking_status, updated_at
   FROM bookings
   WHERE customer_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

2. **If still pending, check webhook was processed:**
   - Look for "Booking X marked as paid successfully" in API logs
   - If missing, webhook didn't fire or failed

3. **Manually trigger webhook for testing:**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## Database Schema Reference

The `bookings` table does NOT have a `paid_at` field. The webhook updates:
- `payment_status` → `'paid'`
- `booking_status` → `'confirmed'`
- `updated_at` → current timestamp
- `payment_schedule` → adds payment record
- `stripe_payment_intent_id` → payment intent ID

## Related Files

- **Webhook handler:** `/src/server/routes/stripe-webhook.js`
- **Database helpers:** `/src/server/db.js`
- **Dashboard query:** `/src/pages/customer/Dashboard.jsx` (line 135: filters for `payment_status = 'paid'`)
- **Environment config:** `/.env`

## Payment Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User completes payment form                              │
│    ↓                                                         │
│ 2. Stripe processes payment                                 │
│    ↓                                                         │
│ 3. Stripe sends webhook to your server                      │
│    ├─ checkout.session.completed                            │
│    └─ payment_intent.succeeded                              │
│    ↓                                                         │
│ 4. Webhook handler calls markBookingPaid()                  │
│    ↓                                                         │
│ 5. Database updated:                                        │
│    ├─ payment_status: pending → paid                        │
│    └─ booking_status: pending → confirmed                   │
│    ↓                                                         │
│ 6. Dashboard query fetches booking                          │
│    (filters: payment_status = 'paid')                       │
│    ↓                                                         │
│ 7. Booking appears on customer dashboard ✅                 │
└─────────────────────────────────────────────────────────────┘
```

## Support

If you encounter issues:
1. Check Stripe CLI output for errors
2. Check API server logs for webhook processing
3. Check Stripe Dashboard → Webhooks → Recent events
4. Verify booking status in database directly

---

**Last Updated:** 2025-10-15
**Status:** Webhooks require setup for local development
