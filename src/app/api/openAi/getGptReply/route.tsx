import {getGpt} from '@app/api/openAi/open-ai-lib'
import {aiThreadMessage} from '@cm/types/open-ai-types'

import {NextRequest, NextResponse} from 'next/server'
import {ChatCompletionCreateParamsBase} from 'openai/resources/chat/completions'

export const POST = async (req: NextRequest) => {
  const body = (await req.json()) as ChatCompletionCreateParamsBase

  const {model, messages, max_tokens, response_format, temperature, top_p} = body
  logConversations({messagesToSend: messages})
  const gpt = getGpt()
  const res = await gpt.chat.completions.create({
    top_p,
    model: model,
    messages,
    max_tokens,
    response_format,
    temperature,
  })

  // const res = await gpt.chat.completions.create(body)

  const reply = res?.choices[0]?.message as aiThreadMessage

  return NextResponse.json({success: true, result: reply, message: `AIの返信が完了しました`})

  function logConversations({messagesToSend}) {
    let letterCount = 0
    messagesToSend.forEach(msg => {
      const {role, content} = msg
      const shortContent = content.length > 30 ? content + '...' : content
      const system = role === 'system'
      const Ai = role === 'assistant'

      let logMsg = system ? `システム: ${shortContent}` : Ai ? `AI: ${shortContent}` : `質問: ${shortContent}`
      logMsg += `\n---------------`
      letterCount += content.length
      if (Ai) {
        console.info({length: content.length, logMsg})
      } else {
        console.info({length: content.length, logMsg})
      }
    })
    console.info(messagesToSend.length + `件の質問を投稿しました【${letterCount}】`)
  }
}

// export async function gpt_fineTuning_loadJsonL({jsonlPath}) {
//   const fileContents = await fs.readFileSync(jsonlPath, 'utf-8')

//   const dataset: any[] = fileContents
//     .split('\n')
//     .filter(line => line)
//     .map(line => {
//       return JSON.parse(line)
//     })

//   console.info('Num examples:', dataset.length)
//   dataset[0].messages.forEach(message => console.info(message))
//   return {fileContents, dataset}
// }

// export const gpt_fineTuning_checkFormatErrors = async ({dataset}) => {
//   const formatErrors = {}

//   dataset.forEach(ex => {
//     if (typeof ex !== 'object') {
//       formatErrors['data_type'] = (formatErrors['data_type'] || 0) + 1
//       return
//     }
//     // ... (他のエラーチェックを続ける)
//   })

//   return formatErrors
// }
