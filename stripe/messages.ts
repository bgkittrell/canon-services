import dotenv from 'dotenv'
dotenv.config()

import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
const snsClient = new SNSClient({})

export const publish = async (message: any) => {
  const response = await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify(message),
      TopicArn: process.env.SNS_TOPIC
    })
  )
  console.log(response)
  return response
}
