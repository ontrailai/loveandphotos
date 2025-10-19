# Complete Client Handoff Checklist

## Overview
This checklist covers **ALL** third-party services and configurations needed to get your Love & Photos website fully operational on your own infrastructure.

**Total Time Required**: 3-4 hours
**Technical Level**: Beginner to Intermediate
**Cost**: ~$50-150/month (depending on usage)

---

## ✅ Handoff Checklist

### 1. **Hosting Platform** (Render.com)

**Purpose**: Hosts your website and serves it to visitors

**Steps**:
- [ ] Create your own Render.com account at https://dashboard.render.com
- [ ] Create a new Web Service
- [ ] Connect to your GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set start command: `npm start`
- [ ] Configure all environment variables (see section below)

**Cost**: Free tier available, or $7-25/month for production
**Documentation**: https://render.com/docs

---

### 2. **Database & Backend** (Supabase)

**Purpose**: Stores all your data (users, bookings, photographers, reviews, etc.)

**What you need to migrate**:
- [ ] **Create new Supabase project** at https://supabase.com
- [ ] **Export current database schema** (your developer can help)
- [ ] **Import data** to your new Supabase project
- [ ] **Get your credentials**:
  - Project URL
  - Anon Key
  - Service Role Key
- [ ] **Update environment variables** on Render

**Email Functionality**:
- [ ] **Set up Supabase Edge Function** for sending emails (see Email Service section)

**Cost**: Free tier: 500MB database, 2GB bandwidth/month
- Pro: $25/month
**Documentation**: https://supabase.com/docs

**Files affected**:
- Database schema: All tables listed in CLAUDE.md
- Authentication: User accounts and sessions
- File storage: Profile pictures, portfolio images

---

### 3. **Email Service** (Supabase Edge Functions)

**Purpose**: Sends transactional emails (booking confirmations, notifications, etc.)

**Current Setup**:
- Emails sent via Supabase Edge Function called `send-email`
- You'll need to configure an email provider

**Options**:

**Option A: Resend** (Recommended - Simple)
- [ ] Create account at https://resend.com
- [ ] Get API key
- [ ] Deploy Supabase Edge Function with Resend integration
- **Cost**: Free tier: 100 emails/day, then $20/month

**Option B: SendGrid**
- [ ] Create account at https://sendgrid.com
- [ ] Get API key
- [ ] Configure Supabase Edge Function
- **Cost**: Free tier: 100 emails/day, then $19.95/month

**Option C: AWS SES** (Cheapest but more complex)
- [ ] Create AWS account
- [ ] Set up SES
- [ ] Verify domain
- **Cost**: $0.10 per 1,000 emails

**What needs configuration**:
```javascript
// You'll need to deploy this Supabase Edge Function:
// supabase/functions/send-email/index.ts

import { Resend } from 'resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  const { to, subject, html } = await req.json()

  const { data, error } = await resend.emails.send({
    from: 'Love & Photos <noreply@yourdomain.com>',
    to,
    subject,
    html
  })

  return new Response(JSON.stringify({ data, error }))
})
```

---

### 4. **Payment Processing** (Stripe)

**Purpose**: Handles all payments from customers

**Steps**:
- [ ] Create Stripe account at https://stripe.com
- [ ] Get your **Test** keys first (for testing):
  - Publishable Key (starts with `pk_test_`)
  - Secret Key (starts with `sk_test_`)
- [ ] **Test your payment flow** with test cards
- [ ] Switch to **Live** keys when ready:
  - Publishable Key (starts with `pk_live_`)
  - Secret Key (starts with `sk_live_`)
- [ ] Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Get webhook secret (starts with `whsec_`)
- [ ] Update environment variables

**Environment Variables Needed**:
```
VITE_STRIPE_PUBLIC_KEY=pk_live_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

**Cost**: 2.9% + $0.30 per transaction
**Documentation**: https://stripe.com/docs

---

### 5. **Video Hosting** (Cloudflare Stream)

**Purpose**: Hosts the background video on your homepage ("Forever Starts Here" section)

**Steps**:
- [ ] Create Cloudflare account at https://cloudflare.com
- [ ] Enable Cloudflare Stream
- [ ] Upload your background video
- [ ] Get HLS Manifest URL
- [ ] Update environment variable: `VITE_CF_STREAM_HLS`

**Detailed Guide**: See `CLOUDFLARE_STREAM_CLIENT_GUIDE.md`

**Cost**:
- Storage: $5 per 1,000 minutes
- Delivery: $1 per 1,000 minutes delivered
- **Typical**: $2-5/month for a single background video

---

### 6. **Image Hosting/CDN** (Cloudflare Images)

**Purpose**: Hosts and optimizes all images on your site (hero images, photographer portfolios, etc.)

**Current Setup**:
- Images served from `imagedelivery.net` (Cloudflare Images)
- Used in homepage hero section and throughout site

**Steps**:
- [ ] Create/use existing Cloudflare account
- [ ] Enable Cloudflare Images
- [ ] **Option A**: Keep existing Cloudflare Images account
  - No action needed if you have access
- [ ] **Option B**: Migrate images to your own Cloudflare Images
  - Upload all images to your account
  - Update image URLs in codebase
- [ ] **Option C**: Use alternative (Cloudinary, imgix, etc.)
  - Will require code changes

**Cost**:
- Cloudflare Images: $5/month for up to 100,000 images served
- Storage: $0.01 per 1,000 images stored per month

**Files affected**:
- `src/pages/Home.jsx` (lines 476-521)
- Any photographer portfolio images
- Profile pictures

---

### 7. **Domain & DNS** (Optional)

**Purpose**: Your custom domain name (e.g., loveandphotos.com)

**Steps**:
- [ ] Register domain (GoDaddy, Namecheap, Cloudflare, etc.)
- [ ] Point DNS to Render.com
- [ ] Configure custom domain in Render
- [ ] Set up SSL certificate (automatic on Render)

**Cost**: $10-20/year for domain registration

---

## 📋 Complete Environment Variables List

You'll need to configure these in **Render.com → Environment Tab**:

### Database (Supabase)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### Payments (Stripe)
```
VITE_STRIPE_PUBLIC_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Email (Resend/SendGrid)
```
RESEND_API_KEY=your_resend_key
# OR
SENDGRID_API_KEY=your_sendgrid_key
```

### Video (Cloudflare Stream)
```
VITE_CF_STREAM_HLS=https://customer-XXXXX.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8
```

### App URLs
```
VITE_APP_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
NODE_ENV=production
```

---

## 💰 Monthly Cost Breakdown

| Service | Purpose | Cost |
|---------|---------|------|
| **Render.com** | Web hosting | $7-25/month |
| **Supabase** | Database & backend | Free-$25/month |
| **Stripe** | Payment processing | 2.9% + $0.30/transaction |
| **Email Service** | Transactional emails | Free-$20/month |
| **Cloudflare Stream** | Background video | $2-5/month |
| **Cloudflare Images** | Image hosting | $5/month |
| **Domain** | Custom domain | $1-2/month |
| **TOTAL** | | **~$50-100/month** |

Plus transaction fees from Stripe (2.9% + $0.30 per booking)

---

## 🚀 Migration Order (Recommended)

Do these in order to minimize downtime:

### Phase 1: Setup (Week 1)
1. ✅ Create Render.com account
2. ✅ Create Supabase account & project
3. ✅ Create Stripe account (use test mode)
4. ✅ Create Cloudflare account

### Phase 2: Data Migration (Week 2)
5. ✅ Export data from current Supabase
6. ✅ Import data to new Supabase
7. ✅ Test database connections locally

### Phase 3: Service Configuration (Week 3)
8. ✅ Upload video to Cloudflare Stream
9. ✅ Configure email service (Resend recommended)
10. ✅ Set up Stripe test mode
11. ✅ Update all environment variables in Render

### Phase 4: Testing (Week 4)
12. ✅ Deploy to Render.com
13. ✅ Test all functionality:
    - User registration/login
    - Booking flow
    - Payment processing (test mode)
    - Email delivery
    - Video playback
14. ✅ Fix any issues

### Phase 5: Go Live (Week 5)
15. ✅ Switch Stripe to live mode
16. ✅ Point domain to Render
17. ✅ Monitor for 24 hours
18. ✅ Celebrate! 🎉

---

## 🆘 Getting Help

### Service-Specific Support
- **Render**: https://render.com/docs
- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs
- **Cloudflare**: https://developers.cloudflare.com
- **Resend**: https://resend.com/docs

### Your Developer
- [Add contact information here]

---

## 📝 Notes

**What you DON'T need to change**:
- The codebase itself
- React components
- Frontend logic
- Database schema structure

**What you DO need to change**:
- Environment variables (credentials)
- Email sending configuration
- Image URLs (if migrating images)

**Critical**: Never expose your `SUPABASE_SERVICE_KEY` or `STRIPE_SECRET_KEY` in frontend code or commit them to Git!

---

**Last Updated**: January 2025
**For**: Complete platform migration and ownership transfer
