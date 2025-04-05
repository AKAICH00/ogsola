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
      '- help',
      '- missions / missions list',
      '- run mission [id] / run mission latest',
      '- status',
      '- xp',
      '- about',
      '- ask [question]', // Still listed, but handled by SIGMA now
      '- theme list',
      '- set theme [name]' // Reminder: Logic not in this file
    ];
  }

  if (lower === 'about') {
    return ['OG Sola OS: A retro modular operating system for Abstract devs. Build. Earn. Unlock secrets.'];
  }

  if (lower === 'theme list') {
    // Note: This is static. Consider fetching from themes.ts if needed.
    return [
      'Available themes:',
      '- CRT Green (default)',
      '- Amber Glow',
      '- Obsidian White',
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
      'OG Sola OS Status:',
      `XP: ${getXP()}`,
      `Missions Completed: ${completed} / ${missions.length}`,
    ];
  }

  // Handle 'run mission' (including potentially triggering SIGMA for mission 1)
  const runMatch = lower.match(/^run mission (\d+|latest)$/);
  if (runMatch) {
      let missionId: number | undefined;
      let missionCompleted = false;
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
              missionCompleted = true;
          } else {
              completeMission(missionId);
              missionResponse = [
                  `[running mission ${missionId}...]`,
                  `✅ ${mission.title} Completed! XP: +${mission.xp}`,
                  `> Objective: ${mission.description}`,
              ];
          }
      } catch (error: any) {
          return [error.message];
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

  // Note: 'set theme' logic is still handled in page.tsx

  // Fallback if no other command matched
  return [`Command not found: ${command}`];
} 