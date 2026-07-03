import { Router } from 'express'
import { puzzleKnowledge } from '../knowledge/puzzles.js'
import { buildSystemPrompt } from '../lib/promptBuilder.js'
import { generateReplyStream } from '../lib/gemini.js'

const MAX_HISTORY_TURNS = 20
const MAX_MESSAGE_LENGTH = 1000
const MAX_TOTAL_LENGTH = 4000

const router = Router()

router.post('/', async (req, res) => {
  const { puzzleId, history } = req.body || {}

  const normalizedPuzzleId = puzzleId === 'general' || puzzleId === undefined ? 'general' : String(puzzleId)
  if (normalizedPuzzleId !== 'general' && !puzzleKnowledge[normalizedPuzzleId]) {
    return res.status(400).json({ error: 'Unknown puzzleId.' })
  }

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: 'history must be a non-empty array.' })
  }

  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS).map((turn) => ({
    role: turn && turn.role === 'model' ? 'model' : 'user',
    text: typeof turn?.text === 'string' ? turn.text.slice(0, MAX_MESSAGE_LENGTH) : '',
  }))

  const totalLength = trimmedHistory.reduce((sum, turn) => sum + turn.text.length, 0)
  if (totalLength === 0) {
    return res.status(400).json({ error: 'history contains no usable messages.' })
  }
  if (totalLength > MAX_TOTAL_LENGTH) {
    return res.status(400).json({ error: 'Message history is too long.' })
  }

  let startedStreaming = false
  try {
    const systemPrompt = buildSystemPrompt(normalizedPuzzleId)
    for await (const textChunk of generateReplyStream(systemPrompt, trimmedHistory)) {
      if (!startedStreaming) {
        startedStreaming = true
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        })
      }
      res.write(textChunk)
    }
    if (!startedStreaming) {
      // Model returned no text at all — still a valid empty-ish reply.
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    }
    res.end()
  } catch (err) {
    console.error('Gemini request failed:', err)
    if (startedStreaming) {
      // Headers already sent — best we can do is end the stream early.
      res.end()
    } else {
      res.status(502).json({ error: 'The assistant is unavailable right now. Try again shortly.' })
    }
  }
})

export default router
