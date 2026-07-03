import { generalContext } from '../knowledge/general.js'
import { puzzleKnowledge } from '../knowledge/puzzles.js'

export function buildSystemPrompt(puzzleId) {
  const puzzle = puzzleKnowledge[puzzleId]
  let prompt = generalContext

  if (!puzzle) {
    prompt +=
      '\n\nThe player is on the general landing page (no specific puzzle open). Answer ' +
      'questions about the event, Serveri ry, and how the puzzle hunt works.'
    return prompt
  }

  prompt += `\n\nThe player currently has puzzle ${puzzleId} open.\n`
  prompt += `Puzzle summary: ${puzzle.summary}\n`
  prompt += `Approved hints you may give: ${puzzle.hints.join(' | ')}\n`

  if (puzzle.hasAnswer) {
    prompt += `\nThe answer character for this puzzle is: "${puzzle.answer}".\n`
    prompt += puzzle.guardInstruction
  } else {
    prompt +=
      '\nYou do NOT know the answer to this puzzle, only the hints above. If asked directly ' +
      "for the answer, say you don't have it."
  }

  prompt += `\nGENERAL GUIDELINES:\nDo not use em dash. \nTry to sound human like.\nDo not answer questions out of scope.\nBe polite but bit nerdy.`


  return prompt
}
