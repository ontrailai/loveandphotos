# Cloudflare Stream - Quick Setup Checklist ✅

## 📥 Step 1: Download Current Video
```
https://customer-rgn1u11lvoqolqnf.cloudflarestream.com/b389be72308f6f818dffea9960e10e89/downloads/default.mp4
```
- [ ] Video downloaded and saved locally

---

## ☁️ Step 2: Upload to Your Cloudflare Account
1. [ ] Login to https://dash.cloudflare.com
2. [ ] Navigate to **Stream** section
3. [ ] Click **"Upload Video"**
4. [ ] Select downloaded video file
5. [ ] Wait for "Ready" status

---

## 🔑 Step 3: Copy Your Credentials

From your uploaded video in Cloudflare Stream dashboard:

- [ ] **HLS Manifest URL** (looks like):
  ```
  https://customer-XXXXXXX.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8
  ```

- [ ] **Customer Subdomain** (looks like):
  ```
  customer-XXXXXXX.cloudflarestream.com
  ```

- [ ] **Video ID** (looks like):
  ```
  abc123def456
  ```

---

## 💻 Step 4: Update Local Development

**File**: `.env.local` (in project root folder)

**Find and replace these lines:**
```env
VITE_CF_STREAM_HLS=https://customer-XXXXXXX.cloudflarestream.com/YOUR_VIDEO_ID/manifest/video.m3u8
VITE_CF_STREAM_SUBDOMAIN=customer-XXXXXXX.cloudflarestream.com
VITE_CF_STREAM_VIDEO_ID=YOUR_VIDEO_ID
```

- [ ] Updated `.env.local` file
- [ ] Saved the file
- [ ] Restarted dev server: `npm run dev`

---

## 🚀 Step 5: Update Production (Render.com)

1. [ ] Login to https://dashboard.render.com
2. [ ] Select your web service
3. [ ] Click **"Environment"** tab
4. [ ] Add/update these 3 variables:

| Variable | Your Value |
|----------|-----------|
| `VITE_CF_STREAM_HLS` | `https://customer-XXXXXXX.cloudflarestream.com/YOUR_VIDEO_ID/manifest/video.m3u8` |
| `VITE_CF_STREAM_SUBDOMAIN` | `customer-XXXXXXX.cloudflarestream.com` |
| `VITE_CF_STREAM_VIDEO_ID` | `YOUR_VIDEO_ID` |

5. [ ] Click **"Save Changes"**
6. [ ] Wait 2-3 minutes for auto-deploy to complete

---

## ✅ Step 6: Verify It Works

**Local:**
- [ ] Visit http://localhost:5173
- [ ] Scroll to "Forever Starts Here" section
- [ ] Video playing in background? ✓

**Production:**
- [ ] Visit https://love-and-photos.onrender.com
- [ ] Scroll to "Forever Starts Here" section
- [ ] Video playing in background? ✓

---

## ⚠️ Quick Troubleshooting

**Video not showing?**
- ✅ Check video is "Ready" in Cloudflare Stream (not "Processing")
- ✅ Check video privacy set to "Public" in Cloudflare
- ✅ Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- ✅ Check browser console (F12) for errors

---

## 📞 Need Help?

See full guide: `docs/CLOUDFLARE_STREAM_HANDOFF.md`

**Cloudflare Support:**
- Docs: https://developers.cloudflare.com/stream/
- Dashboard: https://dash.cloudflare.com/stream
