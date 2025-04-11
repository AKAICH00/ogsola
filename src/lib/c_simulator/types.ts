/**
 * Placeholder type for a simulated C Struct representation.
 * Could be expanded later to include members, etc.
 */
export interface CStruct {
  name: string;
  codeSnippet: string; // The generated C code string
}

/**
 * Placeholder type for a simulated C Function representation.
 * Could include parameters, return type, etc.
 */
export interface CFunction {
  name: string;
  codeSnippet: string;
}

/**
 * Represents the parsed user command related to C simulation.
 */
export interface CSimCommand {
    type: 'generate_struct' | 'generate_function' | 'simulate_compile' | 'explain_concept' | 'unknown';
    name?: string; // Name for struct/function generation
    fileName?: string; // Filename for compile simulation
    concept?: string; // Concept to explain
} 