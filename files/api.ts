import { getUserId } from './auth'

import { getFile, getFiles, createFile, updateFile, deleteFile } from './db'

import { publish } from './messages'

export async function getAll(event: any) {
  console.log('event: ', event)
  const userId = getUserId(event)

  const files = await getFiles(userId)

  return {
    statusCode: 200,
    body: JSON.stringify(files)
  }
}

export async function get(event: any) {
  const id = event.pathParameters.id
  const userId = getUserId(event)

  const file = await getFile(userId, id)

  return {
    statusCode: 200,
    body: JSON.stringify(file)
  }
}

export async function create(event: any) {
  const file = JSON.parse(event.body)
  const userId = getUserId(event)

  const newFile = await createFile(userId, file)

  console.log('newFile: ', newFile)
  await publish({
    type: 'file.created',
    file: newFile
  })
  console.log('published')

  return {
    statusCode: 201,
    body: JSON.stringify(newFile)
  }
}

export async function update(event: any) {
  const id = event.pathParameters.id
  const userId = getUserId(event)
  const file = JSON.parse(event.body)

  const updatedFile = await updateFile(userId, id, file)

  await publish({
    type: 'file.updated',
    file: updatedFile
  })

  return {
    statusCode: 200,
    body: JSON.stringify(updatedFile)
  }
}

export async function destroy(event: any) {
  const id = event.pathParameters.id
  const userId = getUserId(event)

  await deleteFile(userId, id)

  await publish({
    type: 'file.deleted',
    file: {
      id
    }
  })

  return {
    statusCode: 204,
    body: ''
  }
}
