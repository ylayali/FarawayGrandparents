# Appwrite Sites Deployment Guide

This application is **fully compatible with Appwrite Sites** and configured for deployment via Git integration.

## Why Appwrite Sites?

Appwrite Sites is a modern alternative to Vercel and Netlify that offers:
- ✅ **Server-Side Rendering (SSR)** support
- ✅ **Serverless functions** for API routes
- ✅ **Git-based deployments** (automatic builds)
- ✅ **Integrated backend services** (Auth, Database, Storage)
- ✅ **No vendor lock-in** - fully open source
- ✅ **Perfect for this app** since you're already using Appwrite Database

## Deployment Options

### Option 1: Git Integration (Recommended) ⭐

This is the modern, automated approach - similar to Vercel.

**Steps:**

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Ready for Appwrite Sites deployment"
   git push origin main
   ```

2. **Connect Appwrite Sites to your repository**
   - Go to your Appwrite Console
   - Navigate to **Sites** → **Create Site**
   - Select **Git Deployment**
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository

3. **Configure build settings**
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
   - **Install command**: `npm install`

4. **Set environment variables**
   - In Appwrite Console, go to your Site settings
   - Add all environment variables (see list below)

5. **Deploy!**
   - Appwrite will automatically build and deploy on every push

### Option 2: Manual Deployment

If you prefer manual deployment:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Package the build**
   ```bash
   cd .next
   tar --exclude code.tar.gz -czf code.tar.gz .
   cd ..
   ```

3. **Upload to Appwrite**
   - Go to Appwrite Console → Your Site → Deployments
   - Click "Create Deployment" → "Manual"
   - Upload `.next/code.tar.gz`
   - Enable "Activate deployment after build"
   - Click "Create"

## Environment Variables

Set these in your Appwrite Site settings:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE_URL=https://api.openai.com/v1

# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_appwrite_api_key
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=your_images_bucket_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=profiles
NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID=transactions

# Storage Mode
NEXT_PUBLIC_IMAGE_STORAGE_MODE=appwrite

# Stripe (if using payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_PRICE_ID=your_price_id

# Optional
APP_PASSWORD=your_app_password
```

## Local Testing

Before deploying, test locally:

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Edit .env.local with your actual API keys

# 4. Run development server
npm run dev

# 5. Test the application at http://localhost:3000

# 6. Build to verify production build
npm run build
npm start
```

## Application Features

This Next.js application includes:

- **11 API routes** (all supported by Appwrite Sites):
  - `/api/auth-status` - Check authentication
  - `/api/images` - Generate coloring pages
  - `/api/image/[filename]` - Retrieve images
  - `/api/image-delete` - Delete images
  - `/api/signup-with-payment` - Signup with payment
  - `/api/stripe/checkout` - Stripe checkout
  - `/api/stripe/webhook` - Stripe webhooks
  - `/api/stripe/cancel-subscription` - Cancel subscription
  - `/api/groovesell/webhook` - GrooveSell webhooks

- **Server-side processing**:
  - OpenAI image generation
  - File upload handling
  - Authentication with Appwrite
  - Stripe payment processing
  - Storage management

## Troubleshooting

### Build fails on Appwrite Sites

1. Check the build logs in Appwrite Console
2. Ensure all environment variables are set
3. Verify Node.js version compatibility (requires >= 20.0.0)
4. Make sure `package.json` has correct scripts

### API routes not working

1. Verify environment variables are set correctly
2. Check Appwrite API permissions
3. Ensure Appwrite API key has required scopes
4. Review deployment logs for errors

### File uploads failing

1. Check `APPWRITE_API_KEY` has storage permissions
2. Verify bucket ID is correct
3. Ensure bucket has proper permissions configured

## Support

- **Appwrite Documentation**: https://appwrite.io/docs
- **Appwrite Sites Guide**: https://appwrite.io/docs/products/sites
- **Community**: https://discord.gg/GSeTUeA

## Summary

This application is **fully ready for Appwrite Sites deployment** via Git integration. 

Since you're already using Appwrite Database, deploying the frontend to Appwrite Sites gives you:
- ✅ Unified platform (frontend + backend)
- ✅ Single bill and dashboard
- ✅ No vendor lock-in
- ✅ Automatic deployments
- ✅ Built-in CI/CD

Deploy now and enjoy the simplicity of having everything on Appwrite!
