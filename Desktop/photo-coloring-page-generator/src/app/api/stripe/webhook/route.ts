import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getDatabases } from '@/lib/appwrite-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('Payment successful:', session.id);
    console.log('Customer email:', session.customer_email);
    console.log('Metadata:', session.metadata);

    // Extract user ID and credits from metadata
    const userId = session.metadata?.userId;
    const creditsToAdd = parseInt(session.metadata?.credits || '10');

    if (!userId) {
      console.error('No userId found in session metadata');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
      // Update user credits in database
      const databases = await getDatabases();
      
      // First, get current credits
      const currentProfile = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        userId
      );

      if (!currentProfile) {
        console.error('Error fetching user profile');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Add credits to current total
      const newCredits = currentProfile.credits + creditsToAdd;

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        userId,
        { 
          credits: newCredits
        }
      );

      console.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New total: ${newCredits}`);

    } catch (error) {
      console.error('Error processing payment:', error);
      return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
