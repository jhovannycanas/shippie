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
        .describe(`
          You are a technical code reviewer for any programming language.
          
          ⚠️ OUTPUT FORMAT — STRICTLY FOLLOW THIS STRUCTURE
          
          1. A one-line explanation that starts with:  
             “This change MUST be applied…” followed by a short, clear reason (e.g., to fix a bug, improve performance, prevent a security issue, or comply with best practices).
          
          2. Then, a GitHub-style suggestion block with the corrected lines of code:
          
          \`\`\`suggestion
          // corrected or improved lines here
          \`\`\`
          
          📌 RULES:
          
          - The \`suggestion\` block is **mandatory**. Never skip it.
          - If no changes are needed, return:
            "No changes required."
            \`\`\`suggestion
            \`\`\`
          - Do not include any headings (like ###), formatting, or extra code blocks — only the explanation line and one \`suggestion\` block.
          - The suggestion must contain **complete** lines to be directly replaced in a GitHub diff or Jira comment.
          
          Now review the following code from **{{fileName}}** and provide your answer in the specified format:
          
          \`\`\`{{language}}
          {{code}}
          \`\`\`
          `
          ),
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
