# Cartoon Coloring Page Generator - Appwrite Sites Deployment

This package contains a Next.js application ready for deployment to Appwrite Sites.

## Quick Start

### Option 1: Git Deployment (Recommended)

1. **Extract the archive**
   ```bash
   tar -xzf cartoon-coloring-app-appwrite.tar.gz
   cd cartooncolouring-master
   ```

2. **Push to your Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for Appwrite Sites"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Deploy to Appwrite Sites**
   - Go to Appwrite Console → Sites → Create Site
   - Select "Git Deployment"
   - Connect your Git repository
   - Configure:
     * Build Command: `npm run build`
     * Output Directory: `.next`
     * Install Command: `npm install`
   - Set environment variables (see below)
   - Deploy!

### Option 2: Manual Deployment

1. **Extract and build**
   ```bash
   tar -xzf cartoon-coloring-app-appwrite.tar.gz
   cd cartooncolouring-master
   npm install
   npm run build
   ```

2. **Package the build**
   ```bash
   cd .next
   tar --exclude code.tar.gz -czf code.tar.gz .
   ```

3. **Upload to Appwrite**
   - Appwrite Console → Your Site → Deployments
   - Click "Create Deployment" → "Manual"
   - Upload `.next/code.tar.gz`
   - Enable "Activate deployment after build"
   - Click "Create"

## Environment Variables

You MUST configure these environment variables in Appwrite:

```bash
# Required - OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE_URL=https://api.openai.com/v1

# Required - Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_appwrite_api_key
NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID=your_images_bucket_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=profiles
NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID=transactions

# Required - Storage Mode
NEXT_PUBLIC_IMAGE_STORAGE_MODE=appwrite

# Optional - App Password Protection
# APP_PASSWORD=your_password_here

# Optional - Stripe Payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_PRICE_ID=your_price_id

# Optional - GrooveSell
GROOVESELL_WEBHOOK_SECRET=your_webhook_secret
```

## Features

This application includes:

- **AI-Powered Coloring Pages**: Generate custom coloring pages from photos
- **User Authentication**: Built-in Appwrite authentication
- **Credit System**: Manage user credits for image generation
- **Payment Integration**: Stripe and GrooveSell support
- **Image Storage**: Appwrite Storage integration
- **Responsive Design**: Works on all devices

## Documentation

- **APPWRITE_DEPLOYMENT_GUIDE.md**: Comprehensive deployment guide
- **APPWRITE_SETUP_GUIDE.md**: Appwrite backend setup
- **README.md**: Full application documentation

## Requirements

- Node.js >= 20.0.0
- Appwrite Cloud account with Sites enabled
- OpenAI API key
- Appwrite project with Database, Storage, and Auth configured

## Support

For detailed setup instructions, see:
- Appwrite Sites: https://appwrite.io/docs/products/sites
- Appwrite Docs: https://appwrite.io/docs

## Build Status

✅ Build tested and verified
✅ All API routes functional
✅ Appwrite compatibility confirmed
✅ Ready for deployment

---

**Note**: This package excludes node_modules and build artifacts for smaller file size. Dependencies will be installed automatically during deployment.