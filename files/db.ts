import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const tableName = process.env.FILES_TABLE

export const updateJobId = async (fileId: string, jobId: string) => {
  console.log('Updating Job ID:', jobId)
  console.log('File ID:', fileId)
  const command = new UpdateCommand({
    Key: {
      Id: fileId
    },
    UpdateExpression: 'SET TextractJobId = :jobId',
    ExpressionAttributeValues: {
      ':jobId': jobId
    },
    TableName: tableName
  })
  return await dynamo.send(command)
}

export const findByJobId = async (jobId: string) => {
  const filterParams = {
    FilterExpression: 'TextractJobId = :jobId',
    ExpressionAttributeValues: {
      ':jobId': jobId
    },
    TableName: tableName
  }
  return (await dynamo.send(new ScanCommand(filterParams))).Items
}

export const updateTranscript = async (jobId: string, txtKey: string) => {
  const files = await findByJobId(jobId)
  if (!files) return
  for (const file of files) {
    console.log('Updating Transcript:', file)
    await dynamo.send(
      new UpdateCommand({
        Key: {
          Id: file.id
        },
        TableName: tableName,
        UpdateExpression: 'SET TranscriptTxtKey = :txtKey',
        ExpressionAttributeValues: {
          ':txtKey': txtKey
        }
      })
    )
  }
}

export const updateTranscriptError = async (jobId: string, errorMessage: string) => {
  const files = await findByJobId(jobId)
  if (!files) return
  for (const file of files) {
    console.log('Updating Transcript:', file)
    return await dynamo.send(
      new UpdateCommand({
        Key: {
          Id: file.id
        },
        TableName: tableName,
        UpdateExpression: 'SET Transcript.Error = :errorMessage',
        ExpressionAttributeValues: {
          ':errorMessage': errorMessage
        }
      })
    )
  }
}

export const updateAssistant = async (
  fileId: string,
  storageFileId: string,
  vectorStoreFileId: string,
  vectorStoreId: string
) => {
  console.log('Updating file:', fileId, 'with vectorStore file:', vectorStoreFileId)

  return await dynamo.send(
    new UpdateCommand({
      Key: {
        Id: fileId
      },
      UpdateExpression:
        'set StorageFileId = :storageFileId, VectorStoreFileId = :vectorStoreFileId, VectorStoreId = :vectorStoreId',
      ExpressionAttributeValues: {
        ':storageFileId': storageFileId,
        ':vectorStoreFileId': vectorStoreFileId,
        ':vectorStoreId': vectorStoreId
      },
      TableName: tableName
    })
  )
}

export const getFile = async (userId: string, id: string) => {
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

export const getFiles = async (userId: string) => {
  const records = await dynamo.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'UserId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    })
  )
  return records.Items?.map(transformFromDb)
}

export const createFile = async (userId: string, file: any) => {
  const id = uuidv4()
  const record: any = {
    Id: id,
    UserId: userId,
    FileName: file.file_name,
    Key: file.key,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  }
  record.TranscriptUrl = file.transcript_url
  record.ElevenLabsVoiceId = file.eleven_labs_voice_id
  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: record
    })
  )
  return transformFromDb(record)
}

export const updateFile = async (userId: string, id: string, file: any) => {
  const record: any = {
    Id: id,
    UpdatedAt: new Date().toISOString(),
    FileName: file.file_name
  }
  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        Id: id
      },
      UpdateExpression: `SET UpdatedAt = :updatedAt, FileName = :fileName`,
      ConditionExpression: 'UserId = :userid',
      ExpressionAttributeValues: {
        ':updatedAt': record.UpdatedAt,
        ':fileName': record.FileName,
        ':userid': userId
      }
    })
  )
  return transformFromDb(record)
}

export const updateFileError = async (id: string, error: string) => {
  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        Id: id
      },
      UpdateExpression: 'SET #Error = :error',
      ExpressionAttributeNames: {
        '#Error': 'Error'
      },
      ExpressionAttributeValues: {
        ':error': error
      }
    })
  )
}

export const deleteFile = async (userId: string, id: string) => {
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

function transformFromDb(file: any) {
  return {
    id: file.Id,
    user_id: file.UserId,
    file_name: file.FileName,
    created_at: file.CreatedAt,
    key: file.Key,
    vector_store_id: file.VectorStoreId || '',
    vector_store_file_id: file.VectorStoreFileId || '',
    storage_file_id: file.StorageFileId || '',
    url: `https://${process.env.BUCKET_NAME}.s3.us-east-1.amazonaws.com/${file.Key}`,
    is_ready: file.VectorStoreId ? true : false,
    error: file.Error || ''
  }
}
