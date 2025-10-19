# Cloudflare Stream Video Handoff Checklist

## Overview
This guide walks you through transferring the "Forever Starts Here" background video to your own Cloudflare account.

## Current Video Details
- **Location**: "Forever Starts Here" CTA section on homepage
- **Current Video ID**: `b389be72308f6f818dffea9960e10e89`
- **Current Subdomain**: `customer-rgn1u11lvoqolqnf.cloudflarestream.com`

---

## Step-by-Step Transition Guide

### Step 1: Download the Current Video
**Option A - Direct Download from Cloudflare:**
```
Download URL: https://customer-rgn1u11lvoqolqnf.cloudflarestream.com/b389be72308f6f818dffea9960e10e89/downloads/default.mp4
```

**Option B - Contact Current Provider:**
- If you don't have access to download, contact the current Cloudflare account owner
- Request the source video file for the homepage background video

---

### Step 2: Set Up Your Cloudflare Stream Account

1. **Sign in to Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com
   - Use your Cloudflare account credentials

2. **Navigate to Stream**
   - In the left sidebar, click **Stream**
   - Or go directly to: https://dash.cloudflare.com/stream

3. **Verify Billing**
   - Cloudflare Stream requires a paid plan
   - Pricing: ~$1 per 1,000 minutes of video delivered
   - Storage: $5 per 1,000 minutes stored

---

### Step 3: Upload Your Video

1. **Upload the Video**
   - Click **"Upload Video"** button
   - Select the video file you downloaded in Step 1
   - Wait for upload to complete (progress bar will show)

2. **Video Settings (Optional)**
   - Add a title: "Homepage Hero Background Video"
   - Add tags: "homepage", "hero", "background"
   - Keep video **public** (required for website embedding)

3. **Wait for Processing**
   - Cloudflare will process the video (usually 1-5 minutes)
   - Status will change from "Queued" → "Processing" → "Ready"

---

### Step 4: Get Your Video Credentials

Once the video is uploaded and processed:

1. **Click on your uploaded video** in the Stream dashboard

2. **Copy these 3 pieces of information:**

   **A. Video ID**
   - Located under the video title
   - Example: `abc123def456ghi789`
   - ✅ Copy this ID

   **B. Customer Subdomain**
   - Located in the "Stream Delivery" section
   - Format: `customer-XXXXXXX.cloudflarestream.com`
   - ✅ Copy this subdomain

   **C. HLS Manifest URL** (Recommended)
   - Located under "Integration" → "Stream URL"
   - Format: `https://customer-XXXXXXX.cloudflarestream.com/{VIDEO_ID}/manifest/video.m3u8`
   - ✅ Copy this complete URL

---

### Step 5: Update Environment Variables

You'll need to update these in **TWO** places:

#### A. Local Development (.env.local)

1. Open the file: `.env.local` (in the project root)

2. Find this section:
   ```env
   # Cloudflare Stream Video Configuration
   VITE_CF_STREAM_HLS=
   VITE_CF_STREAM_SUBDOMAIN=
   VITE_CF_STREAM_VIDEO_ID=
   ```

3. Replace with YOUR values:
   ```env
   # Cloudflare Stream Video Configuration
   VITE_CF_STREAM_HLS=https://customer-XXXXXXX.cloudflarestream.com/YOUR_VIDEO_ID/manifest/video.m3u8
   VITE_CF_STREAM_SUBDOMAIN=customer-XXXXXXX.cloudflarestream.com
   VITE_CF_STREAM_VIDEO_ID=YOUR_VIDEO_ID
   ```

4. Save the file

#### B. Production Environment (Render.com)

1. **Log in to Render Dashboard**
   - Go to: https://dashboard.render.com
   - Navigate to your web service

2. **Go to Environment Variables**
   - Click on **"Environment"** tab
   - Scroll to "Environment Variables" section

3. **Add/Update these 3 variables:**

   | Variable Name | Value |
   |---------------|-------|
   | `VITE_CF_STREAM_HLS` | `https://customer-XXXXXXX.cloudflarestream.com/YOUR_VIDEO_ID/manifest/video.m3u8` |
   | `VITE_CF_STREAM_SUBDOMAIN` | `customer-XXXXXXX.cloudflarestream.com` |
   | `VITE_CF_STREAM_VIDEO_ID` | `YOUR_VIDEO_ID` |

4. **Click "Save Changes"**
   - Render will automatically redeploy your app with the new variables
   - Wait 2-3 minutes for deployment to complete

---

### Step 6: Verify It's Working

#### Local Development
1. Restart your development server:
   ```bash
   # Stop current server (Ctrl+C)
   # Start fresh server
   npm run dev
   ```

2. Open: http://localhost:5173

3. Scroll to the **"Forever Starts Here"** section (near bottom of homepage)

4. ✅ Verify the background video is playing

#### Production
1. Visit your live website: https://love-and-photos.onrender.com

2. Scroll to the **"Forever Starts Here"** section

3. ✅ Verify the background video is playing

---

## Troubleshooting

### Video Not Showing?

**Check 1: Video Processing Complete?**
- Go to Cloudflare Stream dashboard
- Ensure video status shows "Ready" (not "Processing")

**Check 2: Video is Public?**
- In Cloudflare Stream, click on your video
- Check "Privacy" settings
- Must be set to "Public" for website embedding

**Check 3: Environment Variables Correct?**
- Double-check no extra spaces in variable values
- Ensure the HLS URL ends with `/manifest/video.m3u8`
- Verify the subdomain matches exactly (including `customer-` prefix)

**Check 4: Browser Cache**
- Try a hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open in Incognito/Private browsing mode

**Check 5: Browser Console**
- Open Developer Tools (F12)
- Check Console tab for error messages
- Common errors:
  - `404 Not Found` = Wrong video ID or subdomain
  - `403 Forbidden` = Video not set to public
  - `Network error` = Check Cloudflare Stream service status

### Video Quality Issues?

**Cloudflare automatically optimizes quality based on:**
- Viewer's internet speed
- Device screen size
- Available bandwidth

If you want to control quality settings:
1. Go to Cloudflare Stream dashboard
2. Click on your video
3. Navigate to "Quality" settings
4. Adjust encoding ladder (resolution options)

---

## Cost Estimates

**Cloudflare Stream Pricing (as of 2025):**
- **Storage**: $5 per 1,000 minutes
- **Delivery**: $1 per 1,000 minutes delivered

**Example for a 2-minute background video:**
- Storage: ~$0.01/month
- Delivery: 1,000 page views = ~2,000 minutes delivered = ~$2/month
- **Total**: ~$2-5/month depending on traffic

**Note**: These are estimates. Check Cloudflare's current pricing at https://www.cloudflare.com/products/cloudflare-stream/pricing/

---

## Support Contacts

**Technical Issues:**
- Developer: [Your contact information]
- Documentation: See `/docs` folder in project

**Cloudflare Stream Support:**
- Dashboard: https://dash.cloudflare.com/stream
- Documentation: https://developers.cloudflare.com/stream/
- Support: https://support.cloudflare.com/

---

## Quick Reference

### Files You'll Edit
- `.env.local` (local development)
- Render.com Environment Variables (production)

### Required Values
- ✅ HLS Manifest URL (primary method)
- ✅ Customer Subdomain (backup method)
- ✅ Video ID (backup method)

### Where Video Appears
- Homepage → Bottom section → "Forever Starts Here" CTA

---

**Last Updated**: January 2025
**Document Version**: 1.0
