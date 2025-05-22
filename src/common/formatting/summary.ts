/**
 * Constants for formatting comments
 */
export const FORMATTING = {
  SUMMARY_TITLE: '## Resumen general 🏴‍☠️',
  SEPARATOR: '\n\n---\n\n',
  SIGN_OFF:
    '### Review powered (https://github.com/mattzcarey/shippie) - PR validatoe agente.',
}

/**
 * Formats a thread comment with title, content, and sign-off
 */
export const formatSummary = (comment: string): string => {
  return `${FORMATTING.SUMMARY_TITLE}\n\n${comment}${FORMATTING.SEPARATOR}${FORMATTING.SIGN_OFF}`
}
