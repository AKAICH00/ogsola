// src/lib/c_simulator/parser.ts
import type { CSimCommand } from './types';

/**
 * Parses a natural language request into a structured CSimCommand.
 * This is a very basic placeholder.
 * 
 * TODO: Integrate with a more sophisticated NLP approach via the main agent (SIGMA)
 *       instead of simple keyword matching here.
 */
export function parseRequest(request: string): CSimCommand {
  const lowerRequest = request.toLowerCase();

  const compileMatch = lowerRequest.match(/(?:compile|build) (.+\.c)/);
  if (compileMatch) {
    return { type: 'simulate_compile', fileName: compileMatch[1] };
  }

  const genStructMatch = lowerRequest.match(/generate (?:c )?struct(?: named| for)? (\w+)/);
  if (genStructMatch) {
    return { type: 'generate_struct', name: genStructMatch[1] };
  }
  if (lowerRequest.includes('generate struct')) {
      return { type: 'generate_struct' }; // Generic fallback
  }

  const genFuncMatch = lowerRequest.match(/generate (?:c )?function(?: named| for)? (\w+)/);
  if (genFuncMatch) {
    return { type: 'generate_function', name: genFuncMatch[1] };
  }
  if (lowerRequest.includes('generate function')) {
      return { type: 'generate_function' }; // Generic fallback
  }

  const explainMatch = lowerRequest.match(/explain (?:c )?(?:concept )?(\w+)/);
  if (explainMatch) {
      return { type: 'explain_concept', concept: explainMatch[1] };
  }

  return { type: 'unknown' };
} 