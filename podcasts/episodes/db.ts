import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const tableName = process.env.EPISODES_TABLE

export const getEpisode = async (userId: string, id: string) => {
  const record = await dynamo.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        Id: id
      }
    })
  )
  if (!record.Item || record.Item.UserId !== userId) return null
  return transformFromDb(record.Item)
}

export const getEpisodes = async (userId: string, feedId: string) => {
  const records = await dynamo.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'UserId = :userId AND FeedId = :feedId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':feedId': feedId
      }
    })
  )
  return records.Items?.map(transformFromDb)
}

export const createEpisode = async (userId: string, feedId: string, episode: any) => {
  const id = uuidv4()
  const record: any = {
    Id: id,
    UserId: userId,
    FeedId: feedId,
    Title: episode.title,
    Guid: episode.guid,
    Author: episode.author,
    Description: episode.description,
    Url: episode.url,
    PublishedAt: episode.published_at,
    Duration: episode.duration,
    NeedsTranscription: true,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  }
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: record
    })
  )
  return transformFromDb(record)
}

export const updateEpisode = async (userId: string, id: string, episode: any) => {
  const record: any = {
    Id: id,
    UpdatedAt: new Date().toISOString(),
    Title: episode.title
  }
  const updateExpression = Object.keys(record)
    .map((i: any) => `#${i} = :value${i}`)
    .join(', ')
  const expressionAttributeValues = Object.keys(record).reduce(
    (acc: any, i: any) => ({
      ...acc,
      [`:value${i}`]: record[i]
    }),
    {}
  )

  const expressionAttributeNames = Object.keys(record).reduce(
    (acc: any, i: any) => ({
      ...acc,
      [`#${i}`]: i
    }),
    {}
  )
  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        Id: id
      },
      UpdateExpression: 'SET ' + updateExpression,
      ConditionExpression: 'UserId = :userid',
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: {
        ':userid': userId,
        ...expressionAttributeValues
      }
    })
  )
  return transformFromDb(record)
}

export const deleteEpisode = async (userId: string, id: string) => {
  await dynamo.send(
    new DeleteCommand({
      TableName: tableName,
      Key: {
        Id: id
      },
      ConditionExpression: 'UserId = :userid',
      ExpressionAttributeValues: {
        ':userid': userId
      }
    })
  )
}

function transformFromDb(episode: any) {
  return {
    id: episode.Id,
    user_id: episode.UserId,
    feed_id: episode.FeedId,
    title: episode.Title,
    guid: episode.Guid,
    url: episode.Url,
    author: episode.Author,
    description: episode.Description,
    published_at: episode.PublishedAt,
    duration: episode.Duration
  }
}

export async function needsTranscription() {
  const records = await dynamo.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'NeedsTranscription = :needsTranscription',
      ExpressionAttributeValues: {
        ':needsTranscription': true
      }
    })
  )
  return records.Items?.map(transformFromDb)
}

export async function updateTranscript(id: string, transcript: string) {
  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        Id: id
      },
      UpdateExpression: 'SET TranscriptUrl = :transcript, NeedsTranscription = :needsTranscription',
      ExpressionAttributeValues: {
        ':transcript': transcript,
        ':needsTranscription': false
      }
    })
  )
}

/**
 * This function should only be used internally by the service since it does not scope the episode to the user.
 */
export async function getEpisodeById(id: string) {
  const record = await dynamo.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        Id: id
      }
    })
  )
  return transformFromDb(record.Item)
}
