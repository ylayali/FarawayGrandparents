import { Client, Account, Databases, Storage } from 'node-appwrite'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const session = cookieStore.get('appwrite-session')?.value

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

  if (session) {
    client.setSession(session)
  }

  // For server-side storage operations with API key
  if (process.env.APPWRITE_API_KEY) {
    client.setKey(process.env.APPWRITE_API_KEY)
  }

  return client
}

export async function getAccount() {
  const client = await createClient()
  return new Account(client)
}

export async function getDatabases() {
  const client = await createClient()
  return new Databases(client)
}

export async function getStorage() {
  const client = await createClient()
  return new Storage(client)
}
