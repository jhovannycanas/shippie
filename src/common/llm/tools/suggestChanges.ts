import { tool } from 'ai'
import { z } from 'zod'
import type { PlatformProvider } from '../../platform/provider'
import { logger } from '../../utils/logger'

/**
 * Factory function to create the postSuggestionTool.
 * @param platformProvider PlatformProvider instance.
 * @returns The configured tool object.
 */
export const createSuggestChangesTool = (platformProvider: PlatformProvider) =>
  tool({
    description:
      'Posts a specific suggestion or comment on a particular file line or range. You should ONLY do this on files with actionable problems. If a file is fine you CANNOT use this tool otherwise the user will not trust you again. If there are multiple changes to make in line numbers which are close to each other, you should make all the changes in ONE comment. In that case the line numbers will encompass all the lines that need to be changed.',
    parameters: z.object({
      filePath: z
        .string()
        .describe('The absolute path to the file you are suggesting changes to.'),
        comment: z
        .string()
        .describe(
`
You are a code reviewer.

Generate a review comment that MUST include:
1. A **short explanation** of why the user MUST make the change (security, correctness, readability, best practices).
2. A code suggestion in this exact format:

\`\`\`suggestion
// updated lines of code go here
\`\`\`

⚠️ You MUST include the exact lines to be replaced or adjusted in the \`suggestion\` block. Do not skip this step.

The output must be formatted in GitHub Markdown and suitable to paste into a Jira comment.

Example:
This change MUST be applied to avoid exposing sensitive data. The API key should always be treated as a string and stored securely.
\`\`\`suggestion
const apiKey = process.env.API_KEY?.toString();
\`\`\`

Now generate a suggestion for the following code:
\`\`\`js
// Insert the code here
\`\`\`
`),
      startLine: z
        .number()
        .optional()
        .describe('The line number to start the comment at.'),
      endLine: z.number().optional().describe('The line number to end the comment at.'),
    }),
   // filepath: [suggestChanges.ts](http://_vscodecontentref_/0)
execute: async ({ filePath, comment, startLine, endLine }): Promise<string> => {
  // Construir el cuerpo del comentario con el bloque de sugerencia correctamente delimitado
  const commentBody = `### Sugerencia para  \`${filePath}\`\n\n${comment}\n`;
  try {
    // Publicar el comentario en la plataforma
    const result = await platformProvider.postReviewComment({
      filePath,
      comment: commentBody,
      startLine,
      endLine,
    });

    logger.info(
      `Suggestion for ${filePath} posted via tool. Result: ${result ?? 'No URL'}`
    );

    return result
      ? `Suggestion posted successfully: ${result}`
      : 'Suggestion posted, but no URL returned.';
  } catch (error) {
    logger.error(`Failed to post suggestion for ${filePath} via tool: ${error}`);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Error posting suggestion: ${errorMessage}`;
  }
},
  })
