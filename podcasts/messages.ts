import dotenv from 'dotenv'
dotenv.config()

import { PublishCommand, PublishCommandInput, SNSClient } from '@aws-sdk/client-sns'
const snsClient = new SNSClient({})

export const publish = async (message: any) => {
  const input: PublishCommandInput = {
    Message: JSON.stringify(message),
    TopicArn: process.env.SNS_TOPIC
  }
  console.log('Publishing:', input)
  const response = await snsClient.send(new PublishCommand(input))
  console.log(response)
  return response
}
