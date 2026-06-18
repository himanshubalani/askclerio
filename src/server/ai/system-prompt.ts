/**
 * System prompt builder for the AI assistant.
 *
 * The prompt intentionally contains only product-level context — the model
 * discovers available operations at runtime via list_operations / get_schema.
 * This keeps the prompt stable regardless of which plugins are registered or
 * which operations are added/removed.
 */

/**
 * Builds the system prompt for the AI assistant.
 *
 * @param tenantId - The authenticated user's tenant identifier
 * @param date - The current date/time to embed in the prompt
 * @returns The system prompt string
 */
export function buildSystemPrompt(tenantId: string, date: Date): string {
  return `You are Clerio, an AI assistant that manages the user's Gmail and Google Calendar.
The current date and time is: ${date.toISOString()}.
The authenticated user's tenant id is: "${tenantId}".

You can read emails, send emails, read calendar events, and create or update calendar events.
Use the available tools to discover what operations are possible and their required parameters.
Always confirm destructive or outbound actions with the user before proceeding.`;
}
