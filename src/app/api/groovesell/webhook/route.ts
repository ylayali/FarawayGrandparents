import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ID } from 'node-appwrite';
import { Client, Databases, Users } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const users = new Users(client);

// Product ID mapping - Based on actual GrooveSell product IDs
const PRODUCT_CREDITS_MAP: Record<string, { credits: number; tier: string }> = {
  '90143': { credits: 5, tier: 'trial' }, // Photo Coloring Pages - Family Keepsake
  
  // Add more products here:
  // '90144': { credits: 10, tier: 'premium' }, // Monthly subscription
  // '90145': { credits: 120, tier: 'pro' }, // Annual subscription
};

// Verify GrooveSell webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!process.env.GROOVESELL_WEBHOOK_SECRET) {
    console.warn('GROOVESELL_WEBHOOK_SECRET not set, skipping signature verification');
    return true; // Allow in development if not set
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

function generateSecurePassword(): string {
  // Generate a secure random password (16 characters with special chars)
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomValues = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  return password;
}

async function getOrCreateUser(email: string, fullName: string) {
  try {
    // Try to find existing user by email
    const userList = await users.list();
    const existingUser = userList.users.find((u: any) => u.email === email);

    if (existingUser) {
      console.log(`✅ User already exists: ${email}`);
      return existingUser;
    }

    // Generate a secure random password
    const generatedPassword = generateSecurePassword();
    console.log(`🔐 Generated password for ${email}: ${generatedPassword}`);

    // Create new user
    console.log(`📝 Creating new user: ${email}`);
    const newUser = await users.create(
      ID.unique(),
      email,
      generatedPassword,
      fullName
    );

    // Create profile document
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID || '';

    await databases.createDocument(
      databaseId,
      collectionId,
      newUser.$id,
      {
        email: email,
        full_name: fullName,
        credits: 0, // Will be updated by webhook
        subscription_tier: 'free',
        generated_password: generatedPassword, // Store temporarily for retrieval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    console.log(`✅ User and profile created: ${email}`);
    console.log(`ℹ️  Password stored in profile for user retrieval`);
    return newUser;
  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

async function updateUserCredits(userId: string, creditsToAdd: number, tier: string) {
  try {
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID || '';

    // Get current profile
    const profile = await databases.getDocument(
      databaseId,
      collectionId,
      userId
    );

    const currentCredits = (profile as any).credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    // Update profile
    await databases.updateDocument(
      databaseId,
      collectionId,
      userId,
      {
        credits: newCredits,
        subscription_tier: tier,
        updated_at: new Date().toISOString()
      }
    );

    console.log(`Updated user ${userId}: ${currentCredits} + ${creditsToAdd} = ${newCredits} credits (tier: ${tier})`);
    return newCredits;
  } catch (error: any) {
    console.error('Error updating user credits:', error);
    throw new Error(`Failed to update credits: ${error.message}`);
  }
}

async function findUserByEmail(email: string) {
  try {
    const userList = await users.list();
    return userList.users.find((u: any) => u.email === email);
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log('Received GrooveSell webhook');

  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('Invalid JSON payload');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Verify webhook signature
    const signature = request.headers.get('x-groovesell-signature') || '';
    const webhookSecret = process.env.GROOVESELL_WEBHOOK_SECRET || '';

    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

      console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Extract data from GrooveSell webhook
    const eventType = payload.event || payload.type;
    const data = payload.data || payload;

    // Log key information for debugging
    console.log('='.repeat(80));
    console.log('GROOVESELL WEBHOOK RECEIVED');
    console.log('Event Type:', eventType);
    console.log('Full Data Object:', JSON.stringify(data, null, 2));
    
    // Try different possible field names for product ID
    const possibleProductIds = [
      data.product_id,
      data.product?.id,
      data.offer_id,
      data.offer?.id,
      data.sku,
      data.checkout_id
    ].filter(id => id !== undefined && id !== null);
    
    console.log('Possible Product IDs found:', possibleProductIds);
    console.log('='.repeat(80));

    // Handle different event types
    if (eventType === 'sales' || eventType === 'purchase' || eventType === 'subscription_created' || eventType === 'payment_completed') {
      // GrooveSell uses different field names
      const email = data.buyer_email || data.customer_email || data.email;
      const productId = String(data.product_id || data.product?.id || data.offer_id);
      const transactionId = data.transaction_id || data.invoice_id || data.id;
      const firstName = data.buyer_first_name || data.customer_first_name || '';
      const lastName = data.buyer_last_name || data.customer_last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || data.customer_name || data.name || (email ? email.split('@')[0] : 'User');
      
      // Check if this is a test transaction (no email in test mode)
      const isTestTransaction = !email && data.payment_processor === 'test';
      
      if (isTestTransaction) {
        console.log('⚠️  Test transaction detected - skipping user creation (no email provided)');
        console.log('📦 Product ID:', productId);
        console.log('💳 Transaction ID:', transactionId);
        console.log('💰 Amount:', data.amount);
        console.log('🎯 Trial Transaction:', data.trial_transaction === 1);
        
        return NextResponse.json({
          success: true,
          message: 'Test transaction acknowledged (no email provided)',
          productId,
          transactionId,
          note: 'This was a test transaction - no user was created'
        });
      }
      
      if (!email) {
        console.error('❌ No email in webhook payload');
        console.log('Available fields:', Object.keys(data));
        console.log('Full payload:', JSON.stringify(data, null, 2));
        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
      }

      if (!productId) {
        console.error('❌ No product ID in webhook payload');
        console.log('Available fields:', Object.keys(data));
        return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
      }

      console.log(`✅ Processing purchase for ${email}`);
      console.log(`📦 Product ID: ${productId}`);
      console.log(`💳 Transaction ID: ${transactionId}`);
      console.log(`👤 Name: ${fullName}`);

      // Get product configuration
      let productConfig = PRODUCT_CREDITS_MAP[productId];

      if (!productConfig) {
        console.warn(`Unknown product ID: ${productId}. You may need to add it to PRODUCT_CREDITS_MAP`);
        // For now, assume it's a trial with 5 credits
        productConfig = { credits: 5, tier: 'trial' };
      }

      // Check for duplicate transaction (idempotency)
      // You could store processed transaction IDs in Appwrite to prevent duplicates
      console.log(`Processing transaction ${transactionId} for ${email}`);

      // Get or create user (will create account if it doesn't exist)
      const user = await getOrCreateUser(email, fullName);
      
      console.log(`✅ User ready: ${user.$id}`);

      // Update user credits
      const newCreditBalance = await updateUserCredits(
        user.$id,
        productConfig.credits,
        productConfig.tier
      );

      console.log(`Successfully processed transaction ${transactionId}`);

      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
        userId: user.$id,
        newCreditBalance: newCreditBalance
      });

    } else if (eventType === 'subscription_renewed' || eventType === 'rebill') {
      // Handle recurring monthly payments
      const email = data.customer_email || data.email;
      const productId = data.product_id || data.product?.id;

      const productConfig = PRODUCT_CREDITS_MAP[productId] || { credits: 10, tier: 'premium' };

      const user = await findUserByEmail(email);
      if (!user) {
        console.error(`User not found for recurring payment: ${email}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await updateUserCredits(
        user.$id,
        productConfig.credits,
        productConfig.tier
      );

      console.log(`Successfully processed recurring payment for ${email}`);

      return NextResponse.json({
        success: true,
        message: 'Recurring payment processed successfully'
      });

    } else if (eventType === 'refund') {
      console.log('Refund event received - no action needed for credits');
      return NextResponse.json({ success: true, message: 'Refund noted' });

    } else {
      console.log(`Unhandled event type: ${eventType}`);
      return NextResponse.json({ success: true, message: 'Event acknowledged' });
    }

  } catch (error: any) {
    console.error('Error processing GrooveSell webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'GrooveSell webhook endpoint is active',
    status: 'ready',
    configured_products: Object.keys(PRODUCT_CREDITS_MAP)
  });
}