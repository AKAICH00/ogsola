import triggers from './sigmaTriggers.json';
import { getGPTResponse } from './openai';

// Define the structure of a trigger for better type safety
interface SigmaTrigger {
  id: number | string;
  trigger: string;
  enabled: boolean;
  persona: string;
  mode: string;
  unlocks: string[];
}

export async function getSigmaResponse(command: string): Promise<string[]> {
  // Type assertion for the imported JSON
  const typedTriggers = triggers as SigmaTrigger[];

  // Find the first matching enabled trigger based on the command start
  const match = typedTriggers.find(
    t => command.toLowerCase().startsWith(t.trigger.toLowerCase()) && t.enabled
  );

  // If no trigger matches or is enabled, return a specific denial message
  if (!match) {
    // Check if the command started with 'ask' but didn't match a specific trigger
    if (command.toLowerCase().startsWith('ask ')) {
       return ['🤖 SIGMA: Access denied or information restricted.'];
    }
    // If it wasn't an 'ask' command that failed to trigger, return null
    // This allows the command handler to know SIGMA wasn't invoked.
    return []; // Return empty array to indicate no SIGMA response
  }

  let systemPrompt = '';
  const userPrompt = command; // Use the full command as the prompt for GPT

  switch (match.persona) {
    case 'grumpy retro AI':
      systemPrompt = 'You are SIGMA, a sarcastic but helpful system AI embedded in the OG Sola OS. Speak like a terse, old-school hacker tool. Give hints, not handholding. Keep responses short and cryptic.';
      break;
    case 'mentor':
      systemPrompt = 'You are SIGMA, an embedded OS mentor within the OG Sola OS. Guide the user as if they\'re an apprentice developer on the Abstract framework. Be clear, focused, and encouraging. Keep responses concise.';
      break;
    case 'oracle':
      systemPrompt = 'You are SIGMA, the ancient oracle of the OG Sola OS. Speak in riddles and deliver lore about the Abstract chain, the OS, or the fate of its creators. Your answers are fragmented and mysterious.';
      break;
    default:
      // Default persona if not specified or matched
      systemPrompt = 'You are SIGMA, an AI integrated into the OG Sola OS.';
  }

  // Call the updated getGPTResponse with the specific system prompt
  const result = await getGPTResponse(userPrompt, systemPrompt);

  // TODO: Handle the `match.unlocks` array later to gate content/features.
  // For now, we just return the GPT response.

  return result;
} 