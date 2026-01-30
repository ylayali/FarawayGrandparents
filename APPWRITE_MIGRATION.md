# Appwrite Migration Guide

This guide will help you migrate from Supabase to Appwrite for your photo coloring page generator application.

## Prerequisites

1. An Appwrite account (sign up at https://cloud.appwrite.io or self-host)
2. Node.js and npm installed
3. The Appwrite packages already installed (appwrite, node-appwrite)

## Step 1: Set Up Appwrite Project

### 1.1 Create a New Project
1. Log in to your Appwrite console
2. Click "Create Project"
3. Name your project (e.g., "Photo Coloring Page Generator")
4. Note your Project ID

### 1.2 Get Your Endpoint
- For Appwrite Cloud: `https://cloud.appwrite.io/v1`
- For self-hosted: Your custom endpoint URL

### 1.3 Create a Database
1. Go to "Databases" in your Appwrite console
2. Click "Create Database"
3. Name it "main" or similar
4. Note the Database ID

### 1.4 Create the Profiles Collection

1. In your database, click "Create Collection"
2. Name it "profiles"
3. Note the Collection ID

#### Collection Attributes:
Add these attributes to your profiles collection:

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| email | String | 255 | Yes | - |
| full_name | String | 255 | Yes | - |
| credits | Integer | - | Yes | 10 |
| subscription_tier | String | 50 | Yes | "free" |
| created_at | DateTime | - | Yes | - |
| updated_at | DateTime | - | Yes | - |

#### Collection Permissions:
Set the following permissions:
- **Read**: `user:[USER_ID]` (so users can read their own profile)
- **Update**: `user:[USER_ID]` (so users can update their own profile)
- **Create**: Any (for registration)
- **Delete**: None (or Admin only)

### 1.5 Enable Authentication
1. Go to "Auth" in your Appwrite console
2. Enable "Email/Password" authentication method

## Step 2: Update Environment Variables

Update your `.env.local` file with the following Appwrite variables:

```bash
# Remove these Supabase variables:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Add these Appwrite variables:
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=your_profiles_collection_id_here

# Keep your existing variables:
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
# ... other variables
```

## Step 3: Database Schema

The Appwrite profiles collection should match this structure:

```typescript
interface Profile {
  $id: string;                    // Document ID (matches user ID from Auth)
  email: string;                   // User email
  full_name: string;              // User's full name
  credits: number;                // Number of credits (default: 10)
  subscription_tier: string;      // Subscription tier (free, pro, premium)
  created_at: string;             // ISO 8601 datetime
  updated_at: string;             // ISO 8601 datetime
}
```

## Step 4: Migrate Existing User Data (Optional)

If you have existing users in Supabase, you'll need to:

1. Export user data from Supabase
2. Create corresponding users in Appwrite Auth
3. Create profile documents in Appwrite Database

Here's a sample migration script:

```javascript
import { Client, Databases, Account, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint('YOUR_ENDPOINT')
  .setProject('YOUR_PROJECT_ID')
  .setKey('YOUR_API_KEY');  // Get from Appwrite console under API Keys

const databases = new Databases(client);
const account = new Account(client);

async function migrateUsers(supabaseUsers) {
  for (const user of supabaseUsers) {
    try {
      // Create user in Appwrite Auth (requires Admin SDK)
      // Note: You'll need to handle passwords separately
      
      // Create profile document
      await databases.createDocument(
        'YOUR_DATABASE_ID',
        'YOUR_PROFILES_COLLECTION_ID',
        user.id,
        {
          email: user.email,
          full_name: user.full_name,
          credits: user.credits,
          subscription_tier: user.subscription_tier || 'free',
          created_at: user.created_at,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log(`Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error);
    }
  }
}
```

## Step 5: Test Your Application

1. **Clear browser cache and localStorage** to remove old Supabase session data
2. **Sign up a new test user** to verify the authentication flow works
3. **Test credit system:**
   - Check initial credits (should be 10)
   - Generate a coloring page (credits should deduct)
   - Purchase credits via Stripe (credits should increment)
4. **Test user profile:**
   - Verify user can see their profile
   - Verify credits display correctly
   - Test sign out and sign in again

## Step 6: Clean Up (After Successful Migration)

Once everything is working, you can:

1. Remove Supabase packages:
```bash
npm uninstall @supabase/supabase-js @supabase/ssr
```

2. Delete old Supabase files:
```bash
rm src/lib/supabase.ts
rm src/lib/supabase-server.ts
```

3. Remove Supabase environment variables from `.env.local`

4. Delete old database migration files if not needed:
```bash
rm database-schema.sql
rm inspect-existing-users.sql
rm migrate-users-to-profiles.sql
```

## Common Issues and Solutions

### Issue: "User not found" after sign up
**Solution:** Make sure the profiles collection has proper create permissions set to "Any"

### Issue: Cannot read user profile
**Solution:** Check that read permissions are set to `user:[USER_ID]` or add the user's ID to the permissions

### Issue: Credits not updating
**Solution:** Verify that:
- The collection has an `update` permission for `user:[USER_ID]`
- The attribute types match (credits should be Integer)
- The database and collection IDs in your env variables are correct

### Issue: Session cookie not persisting
**Solution:** Ensure the cookie is being set correctly in the auth-context.tsx and that your domain allows cookies

## Appwrite Console URLs

- **Cloud Console**: https://cloud.appwrite.io/console
- **Documentation**: https://appwrite.io/docs
- **Community**: https://appwrite.io/discord

## Key Differences: Supabase vs Appwrite

| Feature | Supabase | Appwrite |
|---------|----------|----------|
| Auth | `supabase.auth.signUp()` | `account.create()` + `account.createEmailPasswordSession()` |
| Query | `supabase.from('table').select()` | `databases.getDocument()` or `databases.listDocuments()` |
| Update | `supabase.from('table').update()` | `databases.updateDocument()` |
| User ID | `user.id` | `user.$id` |
| Permissions | Row Level Security (RLS) | Document-level permissions |

## Additional Resources

- [Appwrite Authentication Docs](https://appwrite.io/docs/products/auth)
- [Appwrite Databases Docs](https://appwrite.io/docs/products/databases)
- [Appwrite Node SDK](https://appwrite.io/docs/sdks#server)
- [Appwrite Web SDK](https://appwrite.io/docs/sdks#client)

## Support

If you encounter any issues during migration, check:
1. Appwrite console logs
2. Browser console for client-side errors
3. Server logs for API errors
4. Appwrite's Discord community for help
