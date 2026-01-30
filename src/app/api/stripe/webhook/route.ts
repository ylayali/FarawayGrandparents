import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getDatabases } from '@/lib/appwrite-server';
import { Query } from 'appwrite';

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

  // Handle checkout.session.completed (initial signup/payment)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('=== Checkout Session Completed ===');
    console.log('Session ID:', session.id);
    console.log('Mode:', session.mode);
    console.log('Customer email:', session.customer_email);
    console.log('Metadata:', session.metadata);

    const userId = session.metadata?.userId;
    const isSignup = session.metadata?.isSignup === 'true';

    if (!userId) {
      console.error('No userId found in session metadata');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
      const databases = await getDatabases();
      
      // Get current profile
      const currentProfile = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        userId
      );

      if (!currentProfile) {
        console.error('User profile not found');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      let creditsToAdd = 0;
      let subscriptionTier = currentProfile.subscription_tier;

      if (session.mode === 'subscription') {
        // Trial subscription signup
        creditsToAdd = parseInt(session.metadata?.trial_credits || '5');
        subscriptionTier = 'pro';
        console.log(`Trial subscription: adding ${creditsToAdd} trial credits`);
      } else {
        // One-time purchase for extra credits
        creditsToAdd = parseInt(session.metadata?.credits || '5');
        console.log(`One-time purchase: adding ${creditsToAdd} credits`);
      }

      // Update credits and subscription tier
      const newCredits = currentProfile.credits + creditsToAdd;

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        userId,
        { 
          credits: newCredits,
          subscription_tier: subscriptionTier,
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString()
        }
      );

      console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}. New total: ${newCredits}`);

    } catch (error) {
      console.error('Error processing checkout session:', error);
      return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
    }
  }

  // Handle invoice.payment_succeeded (recurring subscription payments)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    
    console.log('=== Invoice Payment Succeeded ===');
    console.log('Invoice ID:', invoice.id);
    console.log('Customer:', invoice.customer);
    console.log('Amount:', invoice.amount_paid / 100, 'USD');

    try {
      const databases = await getDatabases();
      
      // Find user by stripe_customer_id
      const profiles = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        [
          Query.equal('stripe_customer_id', invoice.customer as string)
        ]
      );

      if (profiles.documents.length === 0) {
        console.error('No user found for Stripe customer:', invoice.customer);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const profile = profiles.documents[0];
      const userId = profile.$id;

      // Get recurring credits amount from subscription metadata
      let recurringCredits = 10; // default
      const subscriptionId = (invoice as any).subscription;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        recurringCredits = parseInt(subscription.metadata?.recurring_credits || '10');
      }

      const newCredits = profile.credits + recurringCredits;

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        userId,
        { 
          credits: newCredits,
          updated_at: new Date().toISOString()
        }
      );

      console.log(`✅ Recurring payment: added ${recurringCredits} credits to user ${userId}. New total: ${newCredits}`);

    } catch (error) {
      console.error('Error processing invoice payment:', error);
      return NextResponse.json({ error: 'Recurring payment processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
