import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Client, Databases, Users, ID } from 'node-appwrite';
import { getPackageById } from '@/lib/credit-packages';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log('=== Signup with Payment API Called ===');
    
    const { email, password, fullName, packageId } = await request.json();
    console.log('Request data:', { email, fullName, packageId });

    if (!email || !password || !fullName) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    if (!packageId) {
      console.error('Missing packageId');
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Get the selected package
    const selectedPackage = getPackageById(packageId);
    console.log('Selected package:', selectedPackage);
    
    if (!selectedPackage) {
      console.error('Invalid package ID:', packageId);
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
      .setKey(process.env.APPWRITE_API_KEY || '');

    const users = new Users(client);
    const databases = new Databases(client);

    // Create user account
    console.log('Creating user account...');
    let user;
    try {
      user = await users.create(
        ID.unique(),
        email.trim(),
        password
      );
      console.log('User created successfully:', user.$id);
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
      throw error;
    }

    // Create user profile with 0 credits (will be added after payment)
    console.log('Creating user profile...');
    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
        user.$id,
        {
          email: email.trim(),
          full_name: fullName.trim(),
          credits: 0,
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );
      console.log('Profile created successfully with name:', fullName.trim());
    } catch (error) {
      console.error('Error creating profile:', error);
      // Try to clean up the user if profile creation fails
      try {
        await users.delete(user.$id);
      } catch (deleteError) {
        console.error('Error cleaning up user:', deleteError);
      }
      throw error;
    }

    // Create Stripe checkout session
    console.log('Creating Stripe checkout session...');
    
    const isTrialSubscription = selectedPackage.type === 'trial' && selectedPackage.interval === 'month' && selectedPackage.trialDays;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      success_url: `${request.nextUrl.origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}&new_user=true`,
      cancel_url: `${request.nextUrl.origin}/`,
      customer_email: email.trim(),
      metadata: {
        userId: user.$id,
        credits: selectedPackage.credits.toString(),
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        isSignup: 'true',
        trial_credits: selectedPackage.credits.toString(),
        recurring_credits: '10',
      },
    };

    if (isTrialSubscription) {
      // Create subscription with trial period
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPackage.name} - Subscription`,
              description: `${selectedPackage.description}\n• ${selectedPackage.credits} credits to start\n• 10 credits/month after trial`,
              metadata: {
                trial_credits: selectedPackage.credits.toString(),
                recurring_credits: '10',
              }
            },
            unit_amount: selectedPackage.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ];
      sessionConfig.subscription_data = {
        trial_period_days: selectedPackage.trialDays,
        metadata: {
          userId: user.$id,
          trial_credits: selectedPackage.credits.toString(),
          recurring_credits: '10',
        }
      };
    } else {
      // One-time payment
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPackage.name} - ${selectedPackage.credits} Credits`,
              description: selectedPackage.description,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Stripe session created successfully:', session.id);
    console.log('Checkout URL:', session.url);
    
    return NextResponse.json({ 
      url: session.url,
      userId: user.$id 
    });
  } catch (error) {
    console.error('=== Signup with Payment Error ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Full error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to create account or checkout session',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}