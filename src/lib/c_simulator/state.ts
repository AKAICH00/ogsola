// src/lib/c_simulator/state.ts

/**
 * (Placeholder) Module to manage the conceptual state of the simulated C project.
 * 
 * For example, it could keep track of which structs and functions have been "defined" 
 * by the user interacting with the generator.
 */

import type { CFunction, CStruct } from './types';

interface CSimProjectState {
  definedStructs: Map<string, CStruct>;
  definedFunctions: Map<string, CFunction>;
  // Potentially track file contents conceptually
}

// Placeholder state (in-memory, will reset on page load)
const currentState: CSimProjectState = {
  definedStructs: new Map(),
  definedFunctions: new Map(),
};

export function addDefinedStruct(struct: CStruct): void {
  currentState.definedStructs.set(struct.name, struct);
  console.log(`[C SIMULATOR STATE] Added struct: ${struct.name}`);
}

export function addDefinedFunction(func: CFunction): void {
  currentState.definedFunctions.set(func.name, func);
  console.log(`[C SIMULATOR STATE] Added function: ${func.name}`);
}

export function getProjectState(): Readonly<CSimProjectState> {
  return currentState;
}

// TODO: Add functions to check if identifiers are defined, etc. 