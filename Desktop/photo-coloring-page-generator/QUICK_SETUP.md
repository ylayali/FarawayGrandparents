# Quick Setup Guide

## What Was Fixed

Your app had **file system operations** that don't work on Vercel's serverless platform. I've replaced them with **Appwrite Storage** integration.

## What You Need to Do

### 1. Create Appwrite Storage Bucket (5 minutes)

1. Go to https://cloud.appwrite.io
2. Open your project: `68baa022000486a3c1e2`
3. Click **Storage** → **Create Bucket**
4. Settings:
   - Name: `generated-images`
   - Max file size: `10MB`
   - Allowed extensions: `png, jpeg, jpg, webp`
   - Permissions: Read = `Any`
5. **Copy the Bucket ID** (you'll need this next)

### 2. Create Appwrite API Key (3 minutes)

1. In Appwrite Console: **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `Server Storage Key`
4. Enable scopes:
   - ✅ `files.read`
   - ✅ `files.write`
   - ✅ `files.delete`
5. **Copy the API key** (you can only see it once!)

### 3. Add Environment Variables

#### For Local Development

Edit `.env.local`:

```bash
# Add these two lines:
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=your_bucket_id_from_step_1
APPWRITE_API_KEY=your_api_key_from_step_2
```

#### For Vercel Deployment

1. Go to your Vercel project
2. **Settings** → **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID` = your bucket ID
   - `APPWRITE_API_KEY` = your API key (mark as sensitive)
   - `NEXT_PUBLIC_IMAGE_STORAGE_MODE` = `appwrite`

### 4. Deploy

```bash
git add .
git commit -m "Fixed deployment issues with Appwrite Storage"
git push origin main
```

Or use Vercel CLI:

```bash
vercel --prod
```

## That's It!

Your app should now work on Vercel and Appwrite. Images will be stored in Appwrite Storage instead of the filesystem.

## Need More Details?

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive documentation.

## Changes Made

### Files Modified:
- ✅ `src/lib/appwrite.ts` - Added Storage support
- ✅ `src/lib/appwrite-server.ts` - Added Storage support with API key
- ✅ `src/app/api/images/route.ts` - Upload to Appwrite Storage
- ✅ `src/app/api/image/[filename]/route.ts` - Serve from Appwrite Storage
- ✅ `src/app/api/image-delete/route.ts` - Delete from Appwrite Storage
- ✅ `.env.local` - Added new environment variables

### What's Different:
- ❌ **Before**: Files saved to `/generated-images` directory (doesn't work on Vercel)
- ✅ **After**: Files uploaded to Appwrite Storage (works everywhere)

## Test Your Deployment

1. Visit your deployed URL
2. Upload a photo
3. Generate a coloring page
4. Verify it displays correctly
5. Check Appwrite Console → Storage to see your file

## Troubleshooting

**Images not generating?**
- Check you added the bucket ID and API key
- Verify the bucket exists in Appwrite
- Check Vercel function logs for errors

**Permission errors?**
- Ensure API key has correct scopes
- Check bucket permissions allow `Any` read access

**Still having issues?**
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section
- Check Vercel logs: Project → Deployments → Function Logs
- Check Appwrite logs: Project → Storage → Your bucket
