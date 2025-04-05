// src/lib/missions.ts

export type Mission = {
  id: number;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
};

let missions: Mission[] = [
  {
    id: 1,
    title: 'Hello Module',
    description: 'Deploy a basic module in Abstract.',
    xp: 42,
    completed: false,
  },
  {
    id: 2,
    title: 'Compose Two Modules',
    description: 'Combine two modules in a single flow.',
    xp: 58,
    completed: false,
  },
  {
    id: 3,
    title: 'Optimize XP Usage',
    description: 'Deploy a contract using under 300 XP.',
    xp: 64,
    completed: false,
  },
];

export function getMissionById(id: number): Mission {
  const mission = missions.find((m) => m.id === id);
  if (!mission) throw new Error(`Mission ${id} not found.`);
  return mission;
}

export function completeMission(id: number): void {
  const mission = getMissionById(id);
  mission.completed = true;
}

export function getAllMissions(): Mission[] {
  return missions;
}

export function getXP(): number {
  return missions.filter(m => m.completed).reduce((sum, m) => sum + m.xp, 0);
} 