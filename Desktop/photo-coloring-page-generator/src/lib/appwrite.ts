import { Client, Account, Databases } from 'appwrite'

let client: Client | null = null
let account: Account | null = null
let databases: Databases | null = null

export function createClient() {
  if (!client) {
    client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  }
  return client
}

export function getAccount() {
  if (!account) {
    account = new Account(createClient())
  }
  return account
}

export function getDatabases() {
  if (!databases) {
    databases = new Databases(createClient())
  }
  return databases
}
