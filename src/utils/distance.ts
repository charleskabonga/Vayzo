/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LUSAKA_TOWNSHIPS = [
  'Kabulonga',
  'Woodlands',
  'Rhodes Park',
  'Northmead',
  'Roma',
  'Olympia Park',
  'Longacres',
  'Chelstone',
  'Chilenje'
] as const;

export type LusakaTownship = (typeof LUSAKA_TOWNSHIPS)[number];

// Proximity matrix for Lusaka townships (approximate road network distance in km)
export const TOWNSHIP_PROXIMITY_MATRIX: Record<string, Record<string, number>> = {
  Kabulonga: { Kabulonga: 1.2, Woodlands: 2.2, 'Rhodes Park': 4.1, Northmead: 5.4, Roma: 6.2, 'Olympia Park': 5.8, Longacres: 3.5, Chelstone: 7.8, Chilenje: 4.2 },
  Woodlands: { Woodlands: 1.0, Kabulonga: 2.2, 'Rhodes Park': 3.9, Chilenje: 2.5, Longacres: 3.8, Northmead: 6.1, Roma: 7.5, 'Olympia Park': 6.8, Chelstone: 8.5 },
  'Rhodes Park': { 'Rhodes Park': 1.0, Northmead: 2.1, Longacres: 1.8, Kabulonga: 4.1, Woodlands: 3.9, Roma: 4.5, 'Olympia Park': 3.8, Chelstone: 7.2, Chilenje: 5.1 },
  Northmead: { Northmead: 1.0, 'Rhodes Park': 2.1, 'Olympia Park': 2.4, Roma: 3.5, Longacres: 3.2, Kabulonga: 5.4, Woodlands: 6.1, Chelstone: 6.8, Chilenje: 7.0 },
  Roma: { Roma: 1.2, 'Olympia Park': 1.9, Northmead: 3.5, 'Rhodes Park': 4.5, Kabulonga: 6.2, Woodlands: 7.5, Chelstone: 5.9, Longacres: 4.8, Chilenje: 8.2 },
  'Olympia Park': { 'Olympia Park': 1.0, Roma: 1.9, Northmead: 2.4, 'Rhodes Park': 3.8, Longacres: 4.1, Kabulonga: 5.8, Woodlands: 6.8, Chelstone: 6.4, Chilenje: 7.5 },
  Longacres: { Longacres: 1.0, 'Rhodes Park': 1.8, Kabulonga: 3.5, Woodlands: 3.8, Northmead: 3.2, 'Olympia Park': 4.1, Roma: 4.8, Chelstone: 7.0, Chilenje: 4.6 },
  Chelstone: { Chelstone: 1.5, Roma: 5.9, Northmead: 6.8, Kabulonga: 7.8, Woodlands: 8.5, 'Rhodes Park': 7.2, 'Olympia Park': 6.4, Longacres: 7.0, Chilenje: 9.1 },
  Chilenje: { Chilenje: 1.2, Woodlands: 2.5, Kabulonga: 4.2, Longacres: 4.6, 'Rhodes Park': 5.1, Northmead: 7.0, Roma: 8.2, 'Olympia Park': 7.5, Chelstone: 9.1 }
};

/**
 * Calculates road distance in km between two Lusaka townships.
 */
export function getDistanceBetweenTownships(fromTownship?: string, toTownship?: string): number {
  if (!fromTownship || !toTownship) return 3.5;
  const fromClean = fromTownship.trim();
  const toClean = toTownship.trim();
  if (fromClean.toLowerCase() === toClean.toLowerCase()) return 1.2;
  return (
    TOWNSHIP_PROXIMITY_MATRIX[fromClean]?.[toClean] ??
    TOWNSHIP_PROXIMITY_MATRIX[toClean]?.[fromClean] ??
    4.0
  );
}
