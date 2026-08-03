/**
 * Parses raw challenge reward text and extracts only the core relevant intelligence.
 *
 * Examples:
 * - "DATA FRAGMENT [2/8] LATITUDE: __._820 | Combine with..." -> "LATITUDE: __._820"
 * - "DATA FRAGMENT [5/8] LOC_PART_1: Keili______ | The..." -> "Keili______"
 */
export function extractCoreIntel(rewardText) {
  if (!rewardText || typeof rewardText !== 'string') return ''

  // 1. Strip lead header e.g. "DATA FRAGMENT [x/y]"
  let text = rewardText.replace(/^DATA FRAGMENT\s*\[\d+\/\d+\]\s*/i, '').trim()

  // 2. Take everything before the first '|' (stripping narrative/instructions)
  if (text.includes('|')) {
    text = text.split('|')[0].trim()
  }

  // 3. Strip structural labels like "LOC_PART_1: " to get raw value
  text = text.replace(/^LOC_PART_\d+:\s*/i, '')
  text = text.replace(/^LOC_PART:\s*/i, '')

  return text.trim()
}
