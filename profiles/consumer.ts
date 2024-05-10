import dotenv from 'dotenv'
dotenv.config()

import { ManagementClient } from 'auth0'

export const handler = async (event: any) => {
  const auth0Domain = process.env.AUTH0_DOMAIN
  const clientId = process.env.AUTH0_CLIENT_ID
  const clientSecret = process.env.AUTH0_CLIENT_SECRET
  async function updateMetadata(userId: string, metadata: any) {
    if (!auth0Domain || !clientId || !clientSecret) {
      throw new Error('Auth0 environment variables not set')
    }
    const management = new ManagementClient({
      domain: auth0Domain,
      clientId: clientId,
      clientSecret: clientSecret
    })

    const params = { id: userId }
    await management.users.update(params, metadata)
  }

  const body = JSON.parse(event.Records[0].body)
  const message = JSON.parse(body.Message)
  const type = message.type
  if (type !== 'subscription.created') return
  switch (type) {
    case 'subscription.created':
      const userId = message.user_id
      const metadata = {
        app_metadata: {
          stripe_subscription_id: message.subscription_id,
          stripe_customer_id: message.customer_id
        }
      }
      await updateMetadata(userId, metadata)
      break
    default:
      console.log('Unhandled event type:', type)
  }
}
