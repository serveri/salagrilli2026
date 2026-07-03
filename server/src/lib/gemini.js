import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MODEL = 'gemini-3.1-flash-lite'
const MAX_OUTPUT_TOKENS = 300

export async function* generateReplyStream(systemPrompt, history) {
  const contents = history.map((turn) => ({
    role: turn.role === 'model' ? 'model' : 'user',
    parts: [{ text: turn.text }],
  }))

  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  })

  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text
  }
}
