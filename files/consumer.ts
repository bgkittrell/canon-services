import dotenv from 'dotenv'
dotenv.config()
import {
  updateJobId,
  updateTranscript,
  updateTranscriptError,
  updateAssistant,
  updateFileError
} from './db'

export const handler = async (event: any) => {
  console.log('Event:', event)
  const body = JSON.parse(event.Records[0].body)
  const message = JSON.parse(body.Message)
  const type = message.type
  switch (type) {
    case 'document.conversion.started':
      const jobId = message.job_id
      const fileId = message.file_id
      console.log('changed')
      console.log('changed')
      await updateJobId(fileId, jobId)
      break

    case 'document.conversion.finished':
      const finishedJobId = message.job_id
      const txtKey = message.txt_key
      console.log('Updating Transcript:', finishedJobId, txtKey)
      const response = await updateTranscript(finishedJobId, txtKey)
      console.log('Response:', response)

      break
    case 'document.conversion.failed':
      await updateTranscriptError(message.job_id, message.error)

      break
    case 'assistant.file.created':
      await updateAssistant(
        message.file_id,
        message.storage_file_id,
        message.vector_store_id,
        message.vector_store_file_id
      )
      break
    case 'assistant.file.error':
      await updateFileError(message.file_id, message.error)
      break
    default:
      return {
        body: 'Method Not Allowed'
      }
  }
}
