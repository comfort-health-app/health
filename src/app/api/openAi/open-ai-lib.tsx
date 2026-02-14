import {requestResultType} from '@cm/types/types'
import {fetchAlt} from '@cm/lib/http/fetch-client'

import OpenAI from 'openai'
import {ChatCompletionCreateParamsBase} from 'openai/resources/chat/completions'

export const getGpt = () => {
  return new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
}

export const gpt_chat_getGptReply = async (props: ChatCompletionCreateParamsBase) => {
  props.model === defaultGptModel
  const res: requestResultType = await fetchAlt(`/api/openAi/getGptReply`, {...props})
  return res
}

export const defaultGptModel = `gpt-4o-mini`
