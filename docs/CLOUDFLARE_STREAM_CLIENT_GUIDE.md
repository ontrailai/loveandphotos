# Update Homepage Background Video - Client Guide

## Overview
This guide shows you how to replace the background video in the "Forever Starts Here" section with your own Cloudflare Stream video.

**Time Required**: 15-20 minutes
**Technical Level**: Beginner-friendly
**You will need**: Cloudflare account with billing enabled

---

## Step 1: Download the Current Video (Optional)

If you want to keep using the same video, download it first:

**Download Link**:
```
https://customer-rgn1u11lvoqolqnf.cloudflarestream.com/b389be72308f6f818dffea9960e10e89/downloads/default.mp4
```

- Right-click the link → "Save Link As..."
- Or paste the URL in your browser and download

> **Note**: If you have your own video ready, skip this step!

---

## Step 2: Upload to Your Cloudflare Account

### A. Access Cloudflare Stream

1. Go to https://dash.cloudflare.com and sign in
2. Click **"Stream"** in the left sidebar
3. Click the **"Upload Video"** button

### B. Upload Your Video

1. **Select your video file** (the one you downloaded or your own video)
2. **Optional**: Add a title like "Homepage Background Video"
3. **Wait for upload** - you'll see a progress bar
4. **Wait for processing** - Status will change from "Processing" to "Ready" (1-5 minutes)

### C. Make Video Public

1. Click on your uploaded video
2. Find **"Privacy"** or **"Signed URLs"** settings
3. Make sure it's set to **"Public"** (required for your website)

---

## Step 3: Get Your Video Information

With your video open in Cloudflare Stream:

### Find the HLS Manifest URL

1. Look for **"Integration"** or **"Stream URL"** section
2. You'll see a URL that looks like:
   ```
   https://customer-XXXXXXX.cloudflarestream.com/abc123def456/manifest/video.m3u8
   ```
3. **Copy this entire URL** - you'll need it in the next step

> **Tip**: It should end with `/manifest/video.m3u8`

---

## Step 4: Update Your Live Website

### A. Login to Render

1. Go to https://dashboard.render.com
2. Sign in with your Render account
3. Click on your **"love-and-photos"** web service (or whatever it's called)

### B. Update Environment Variables

1. Click the **"Environment"** tab (on the left side)
2. Scroll down to **"Environment Variables"** section
3. Look for a variable called **`VITE_CF_STREAM_HLS`**

**If it already exists:**
- Click the **Edit** button (pencil icon)
- Replace the value with YOUR HLS URL from Step 3
- Click **"Save"**

**If it doesn't exist:**
- Click **"Add Environment Variable"**
- Key: `VITE_CF_STREAM_HLS`
- Value: Paste your HLS URL from Step 3
- Click **"Add"**

4. Click **"Save Changes"** at the bottom

### C. Wait for Deployment

- Render will automatically redeploy your website
- This takes **2-3 minutes**
- You'll see a status indicator showing deployment progress
- Wait for it to say **"Live"** or **"Deployed"**

---

## Step 5: Verify It's Working

1. **Visit your live website**: https://love-and-photos.onrender.com
2. **Scroll down** to the "Forever Starts Here" section (near the bottom)
3. **Check if the video is playing** in the background

### Can't see the video?

- Try refreshing the page: Press **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
- Or try opening in a private/incognito window

---

## Troubleshooting

### "Video still not showing after 5 minutes"

**Check 1**: Is video processing complete in Cloudflare?
- Go back to Cloudflare Stream dashboard
- Make sure your video shows **"Ready"** status (not "Processing")

**Check 2**: Is video set to Public?
- Click on your video in Cloudflare
- Check Privacy settings
- Should be "Public" not "Private"

**Check 3**: Is the URL correct?
- Go back to Render.com environment variables
- Check the `VITE_CF_STREAM_HLS` value
- Should end with `/manifest/video.m3u8`
- No extra spaces at beginning or end

**Check 4**: Did the deployment finish?
- In Render dashboard, check deployment status
- Should say "Live" with a green indicator

### "Video is low quality"

- Cloudflare automatically adjusts quality based on internet speed
- Video quality will improve on faster connections
- You can adjust quality settings in Cloudflare Stream dashboard → Video Settings

---

## Quick Reference Card

**What you need from Cloudflare:**
```
✅ HLS Manifest URL
   Format: https://customer-XXXXX.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8
```

**Where to paste it:**
```
✅ Render.com → Your Service → Environment → Environment Variables
   Variable Name: VITE_CF_STREAM_HLS
   Variable Value: [Paste your HLS URL here]
```

**Where video appears:**
```
✅ Homepage → Scroll to bottom → "Forever Starts Here" section
```

---

## Cost Information

**Cloudflare Stream Pricing**:
- Storage: $5 per 1,000 minutes of video
- Delivery: $1 per 1,000 minutes delivered to viewers

**For a typical 2-minute background video**:
- Storage: ~$0.01/month
- Delivery: ~$2-5/month (depending on website traffic)

Check current pricing: https://www.cloudflare.com/products/cloudflare-stream/pricing/

---

## Need Help?

**Cloudflare Support:**
- Documentation: https://developers.cloudflare.com/stream/
- Dashboard: https://dash.cloudflare.com/stream

**Your Developer:**
- [Add your contact information here]

---

**Last Updated**: January 2025
**For**: Non-technical website owners
