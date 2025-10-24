import { Client, Account, Databases } from 'node-appwrite'
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
