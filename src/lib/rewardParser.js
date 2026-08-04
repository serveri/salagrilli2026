export function extractCoreIntel(rewardText) {
  if (!rewardText || typeof rewardText !== 'string') return ''

  let text = rewardText.replace(/^DATA FRAGMENT\s*\[\d+\/\d+\]\s*/i, '').trim()

  if (text.includes('|')) {
    text = text.split('|')[0].trim()
  }

  text = text.replace(/^LOC_PART_\d+:\s*/i, '')
  text = text.replace(/^LOC_PART:\s*/i, '')

  return text.trim()
}
