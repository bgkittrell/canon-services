import axios from 'axios'
import pt from 'podcast-partytime'
import { publish } from '../messages'
import { createEpisode } from './db'

export const handler = async (event: any) => {
  console.log('Event:', event)
  const body = JSON.parse(event.Records[0].body)
  const message = JSON.parse(body.Message)
  const type = message.type
  switch (type) {
    case 'feed.created':
      await createEpisodes(message.feed)
      break
    case 'episode.ready':
      console.log('Episode:', message.episode)
      const newEpisode = await createEpisode(
        message.episode.user_id,
        message.episode.feed_id,
        message.episode
      )
      await publish({
        type: 'episode.created',
        episode: newEpisode
      })
      break
    default:
      return {
        body: 'Method Not Allowed'
      }
  }
}

async function createEpisodes(feed: any) {
  const feedXml = await axios.get(feed.url)
  console.log('Feed:', feedXml.data)

  const episodes = pt.parseFeed(feedXml.data)
  console.log('Episodes:', episodes)
  if (!episodes) {
    throw new Error('No episodes found')
  }

  for (const episode of episodes.items) {
    await publish({
      type: 'episode.ready',
      episode: {
        user_id: feed.user_id,
        feed_id: feed.id,
        title: episode.title,
        description: episode.description,
        author: episode.author,
        url: episode.enclosure.url,
        published_at: episode.pubDate,
        duration: episode.duration,
        guid: episode.guid
      }
    })
  }
}
