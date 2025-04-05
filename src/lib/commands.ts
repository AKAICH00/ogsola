// src/lib/commands.ts
import {
  getMissionById,
  completeMission,
  getAllMissions,
  getXP,
} from './missions';
// Remove the direct import of getGPTResponse
// import { getGPTResponse } from './openai';
// Import the new SIGMA handler
import { getSigmaResponse } from './sigma';
// Comment out unused import
// import { runGameLoop } from './gameEngine';

// Make the function async to handle the await for getGPTResponse
export async function handleCommand(command: string): Promise<string[]> {
  const lower = command.toLowerCase().trim();
  const originalCaseCommand = command.trim(); // Keep original case for the prompt

  // Check for SIGMA triggers first
  const sigmaResult = await getSigmaResponse(originalCaseCommand);
  // If sigmaResult is not empty, SIGMA handled the command (or denied access)
  if (sigmaResult.length > 0) {
    return sigmaResult;
  }

  // If SIGMA didn't handle it, proceed with other commands

  if (lower === 'help') {
    return [
      'Available commands:',
      '- start',
      '- rename',
      '- help',
      '- missions / missions list',
      '- run mission [id | latest]',
      '- run game [id | number] [single|multi]',
      '- status',
      '- xp',
      '- about',
      '- ask [question]', // Still listed, but handled by SIGMA now
      '- theme list',
      '- set theme [name]', // Reminder: Logic not in this file
      '- clear' // Make sure clear is listed
    ];
  }

  if (lower === 'about') {
    return ['OG Solas OS: A retro modular operating system for Abstract devs. Build. Earn. Unlock secrets.'];
  }

  if (lower === 'theme list') {
    // Update to show theme names with their actual identifiers
    return [
      'Available themes:',
      '- CRT Green (default) [set theme green]',
      '- Amber Glow [set theme amber]',
      '- Obsidian White [set theme white]',
      '- Vaporwave (locked)'
    ];
  }

  if (lower === 'missions' || lower === 'missions list') {
    const missions = getAllMissions();
    return [
      'Available Missions:',
      ...missions.map((m) => {
        const status = m.completed ? '[x]' : '[ ]';
        return `${status} ID ${m.id}: ${m.title} (+${m.xp} XP)`;
      }),
    ];
  }

  if (lower === 'xp') {
    return [`Your total XP: ${getXP()}`];
  }

  if (lower === 'status') {
    const missions = getAllMissions();
    const completed = missions.filter((m) => m.completed).length;
    return [
      'OG Solas OS Status:',
      `XP: ${getXP()}`,
      `Missions Completed: ${completed} / ${missions.length}`,
    ];
  }

  // Handle 'run mission' (including potentially triggering SIGMA for mission 1)
  const runMatch = lower.match(/^run mission (\d+|latest)$/);
  if (runMatch) {
      let missionId: number | undefined;
      let missionResponse: string[] = [];

      if (runMatch[1] === 'latest') {
          const next = getAllMissions().find((m) => !m.completed);
          if (!next) {
              return ['🎉 All missions completed!'];
          }
          missionId = next.id;
      } else {
          missionId = parseInt(runMatch[1]);
          if (isNaN(missionId)) {
              return [`Invalid mission ID: ${runMatch[1]}`]; // Should not happen with regex, but good practice
          }
      }

      try {
          const mission = getMissionById(missionId);
          if (mission.completed) {
              missionResponse = [`✅ Mission ${missionId} already completed! XP: ${mission.xp}`];
          } else {
              completeMission(missionId);
              missionResponse = [
                  `[running mission ${missionId}...]`,
                  `✅ ${mission.title} Completed! XP: +${mission.xp}`,
                  `> Objective: ${mission.description}`,
              ];
          }
      } catch (error: unknown) {
          if (error instanceof Error) {
             return [error.message];
          } else {
             return ['An unknown error occurred during mission execution.'];
          }
      }

      // Check if SIGMA should respond *after* completing the mission
      const sigmaPostMissionResult = await getSigmaResponse(`run mission ${missionId}`);
      if (sigmaPostMissionResult.length > 0) {
          // Combine the mission result and the SIGMA response
          return [...missionResponse, ...sigmaPostMissionResult];
      }

      // Otherwise, just return the standard mission response
      return missionResponse;
  }

  // Handle 'run game' command
  const gameMatch = lower.match(/^run game (.+)$/);
  if (gameMatch) {
      const gameId = gameMatch[1];
      // Comment out unused variable
      // let simulatedInputs: string[] = []; 

      // Use different inputs based on the game ID
      if (gameId === 'pong' || gameId === 'abstract-pong') { // Added abstract-pong
        // W/S controls are handled by UI now
        // No simulated inputs needed for interactive mode
      } else if (gameId === 'solas-pong') {
         // A/D controls - keep simulation inputs for this older version
         // Commented out: simulatedInputs = ['d', 'd', 'a', 'a', 'a', 'd', 'd', 'd', 'a'];
      } else {
        return [`Unknown game ID for simulation: ${gameId}`];
      }
      
      // For interactive games, runGameLoop now just initializes and maybe shows first frame if needed.
      // The real loop is in page.tsx. We return an empty array or loading message?
      // Let's return an empty array, as page.tsx handles the transition message.
      // return runGameLoop(gameId, simulatedInputs); // Old simulation call
      return []; // Return empty array - UI handles game start message
  }

  // Note: 'set theme' logic is still handled in page.tsx

  // Fallback if no other command matched
  return [`Command not found: ${command}`];
} 