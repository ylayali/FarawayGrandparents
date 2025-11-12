# Deployment Guide for Photo Coloring Page Generator

## Issues Fixed

This guide addresses the deployment issues that prevented the app from working on Vercel and Appwrite.

### Critical Issues Resolved

1. **File System Operations Removed**
   - Replaced all `fs` (filesystem) operations with Appwrite Storage
   - Removed dependencies on local `generated-images` directory
   - API routes now work in serverless environments like Vercel

2. **Appwrite Storage Integration**
   - Added Storage support to both client and server Appwrite configurations
   - Implemented image upload to Appwrite Storage buckets
   - Updated image serving to fetch from Appwrite Storage
   - Updated image deletion to remove files from Appwrite Storage

3. **Environment Variables**
   - Added required Appwrite Storage bucket ID
   - Added Appwrite API key for server-side operations

## Prerequisites

Before deploying, you need:

1. **Appwrite Account** - https://cloud.appwrite.io
2. **Vercel Account** - https://vercel.com
3. **OpenAI API Key** - https://platform.openai.com/api-keys
4. **Stripe Account** (if using payments) - https://stripe.com

## Step 1: Set Up Appwrite Storage

### 1.1 Create Storage Bucket

1. Log into your Appwrite Console: https://cloud.appwrite.io
2. Select your project (ID: `68baa022000486a3c1e2`)
3. Navigate to **Storage** in the left sidebar
4. Click **Create Bucket**
5. Configure the bucket:
   - **Name**: `generated-images` (or any name you prefer)
   - **Bucket ID**: Leave as auto-generated or set custom
   - **File Security**: Enable
   - **Maximum File Size**: Set to at least 10MB
   - **Allowed File Extensions**: Add `png`, `jpg`, `jpeg`, `webp`
   - **Compression**: Optional (recommended: none for coloring pages)
   - **Encryption**: Enable if needed
   - **Antivirus**: Enable if available

6. **Important**: Copy the Bucket ID - you'll need it for environment variables

### 1.2 Configure Bucket Permissions

1. In your bucket settings, go to the **Settings** tab
2. Under **Permissions**, add:
   - **Read Access**: `Any` (to allow users to view generated images)
   - **Write Access**: `Users` (optional, if users should upload)
   - **Delete Access**: `Users` (optional, if users should delete their images)

Alternatively, you can manage permissions server-side using the API key.

### 1.3 Generate API Key

1. In Appwrite Console, go to your project
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Configure:
   - **Name**: `Server Storage Key` (or similar)
   - **Expiration**: Set as needed (recommend no expiration for production)
   - **Scopes**: Enable:
     - `files.read` - Read files
     - `files.write` - Create files
     - `files.delete` - Delete files
5. **Important**: Copy the API key immediately - you won't see it again

## Step 2: Configure Environment Variables

### 2.1 Update `.env.local` for Local Development

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=68baa022000486a3c1e2
NEXT_PUBLIC_APPWRITE_DATABASE_ID=68fb69920001f8b307dd
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=profiles
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=your_bucket_id_here  # Add your bucket ID
APPWRITE_API_KEY=your_api_key_here  # Add your API key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration (if using)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Image Storage Mode
NEXT_PUBLIC_IMAGE_STORAGE_MODE=appwrite  # Use 'appwrite' for production
```

### 2.2 Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | `https://cloud.appwrite.io/v1` | Production, Preview, Development |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | `68baa022000486a3c1e2` | Production, Preview, Development |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | `68fb69920001f8b307dd` | Production, Preview, Development |
| `NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID` | `profiles` | Production, Preview, Development |
| `NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID` | Your bucket ID | Production, Preview, Development |
| `APPWRITE_API_KEY` | Your API key | Production, Preview, Development |
| `OPENAI_API_KEY` | Your OpenAI key | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | Your Stripe secret | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe public key | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | Your webhook secret | Production |
| `NEXT_PUBLIC_IMAGE_STORAGE_MODE` | `appwrite` | Production, Preview, Development |

**Important**: Mark sensitive keys (API keys, secrets) as **sensitive** in Vercel to hide them from logs.

## Step 3: Deploy to Vercel

### 3.1 First-Time Deployment

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Link to existing project or create new
   - Set up project settings
   - Deploy

### 3.2 Deploy from Git

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to Vercel Dashboard
3. Click **Add New Project**
4. Import your repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or your project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add environment variables (from Step 2.2)
7. Click **Deploy**

### 3.3 Subsequent Deployments

With Git integration, Vercel automatically deploys when you push to your repository:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Step 4: Configure Stripe Webhooks (if using payments)

1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Set endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
5. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - Any other relevant events
6. Copy the **Signing secret**
7. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test Your Deployment

### 5.1 Verify Image Generation

1. Visit your deployed app
2. Upload a photo
3. Generate a coloring page
4. Verify:
   - Image generates successfully
   - Image displays correctly
   - Image is stored in Appwrite Storage bucket
   - No errors in browser console or Vercel logs

### 5.2 Verify Image Deletion

1. Delete a generated image
2. Verify:
   - Image is removed from UI
   - Image is deleted from Appwrite Storage bucket
   - No errors in Vercel logs

### 5.3 Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click on a deployment
4. View **Function Logs** to check for errors
5. Look for successful Appwrite Storage operations

### 5.4 Check Appwrite Logs

1. Go to Appwrite Console
2. Select your project
3. Navigate to **Storage** → Your bucket
4. Verify files are being created and deleted
5. Check for any permission or quota issues

## Troubleshooting

### Issue: "APPWRITE_API_KEY is not set"

**Solution**: Ensure you've added the API key to Vercel environment variables and redeployed.

### Issue: "Bucket not found"

**Solution**: 
- Verify the bucket ID in environment variables matches your Appwrite bucket
- Check bucket exists in Appwrite Console
- Ensure API key has access to the bucket

### Issue: "Permission denied" when uploading images

**Solution**:
- Check bucket permissions in Appwrite
- Verify API key has `files.write` scope
- Ensure API key hasn't expired

### Issue: Images not displaying

**Solution**:
- Check bucket has read permissions set correctly
- Verify `NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID` is set
- Check Appwrite Storage service is enabled

### Issue: "File size too large"

**Solution**:
- Increase maximum file size in Appwrite bucket settings
- Adjust compression settings in your image generation code

### Issue: Build fails on Vercel

**Solution**:
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify TypeScript configuration is correct
- Check if environment variables are properly set

## Performance Optimization

### 1. Image Caching

Configure caching headers in `src/app/api/image/[filename]/route.ts`:

```typescript
headers: {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=31536000, immutable'
}
```

### 2. Appwrite CDN

Appwrite automatically provides CDN for storage files. Ensure you're using the correct URLs.

### 3. Image Optimization

Consider implementing:
- Progressive image loading
- Thumbnail generation
- WebP format for better compression

## Security Considerations

### 1. API Key Security

- **Never** commit API keys to Git
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Use minimal required permissions for each key

### 2. Bucket Permissions

- Set appropriate read/write permissions
- Consider user-level permissions for multi-tenant scenarios
- Enable antivirus scanning if available

### 3. Rate Limiting

Implement rate limiting to prevent abuse:
- Use Vercel's edge config for rate limiting
- Implement user-based quotas in Appwrite
- Monitor usage patterns

## Monitoring and Maintenance

### 1. Regular Checks

- Monitor Appwrite Storage quota usage
- Check Vercel function execution times
- Review error logs regularly
- Monitor API rate limits (OpenAI, Stripe)

### 2. Backup Strategy

- Regularly export generated images if needed
- Back up Appwrite database
- Keep environment variable backups secure

### 3. Updates

- Keep dependencies updated: `npm update`
- Monitor for security vulnerabilities: `npm audit`
- Update Appwrite SDK when new versions release
- Test thoroughly after updates

## Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Appwrite Storage API](https://appwrite.io/docs/storage)

## Support

If you encounter issues:

1. Check Vercel function logs
2. Check Appwrite Console logs
3. Review this deployment guide
4. Check GitHub issues for similar problems
5. Contact support if needed

---

**Last Updated**: December 11, 2025

This deployment guide ensures your Photo Coloring Page Generator app works correctly on Vercel with Appwrite Storage.
