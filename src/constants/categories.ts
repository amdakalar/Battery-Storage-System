/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DroneCategoryInfo {
  id: string;
  name: string;
  type: 'CAMERA' | 'GPS';
  typeLabel: string;
  weight: string;
  icon: string;
  badgeColor: string;
  headerBg: string;
  borderColor: string;
}

export const DRONE_CATEGORIES: DroneCategoryInfo[] = [
  {
    id: 'درۆن (کامێرا) 2kg',
    name: 'درۆن (کامێرا) 2kg',
    type: 'CAMERA',
    typeLabel: 'کامێرا',
    weight: '2kg',
    icon: '📷',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headerBg: 'bg-indigo-50/50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'درۆن (کامێرا) 5kg',
    name: 'درۆن (کامێرا) 5kg',
    type: 'CAMERA',
    typeLabel: 'کامێرا',
    weight: '5kg',
    icon: '📷',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'bg-blue-50/50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'درۆن (کامێرا) 10kg',
    name: 'درۆن (کامێرا) 10kg',
    type: 'CAMERA',
    typeLabel: 'کامێرا',
    weight: '10kg',
    icon: '📷',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    headerBg: 'bg-cyan-50/50',
    borderColor: 'border-cyan-200',
  },
  {
    id: 'درۆن (GPS) 5kg',
    name: 'درۆن (GPS) 5kg',
    type: 'GPS',
    typeLabel: 'GPS',
    weight: '5kg',
    icon: '🛰️',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headerBg: 'bg-emerald-50/50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'درۆن (GPS) 10kg',
    name: 'درۆن (GPS) 10kg',
    type: 'GPS',
    typeLabel: 'GPS',
    weight: '10kg',
    icon: '🛰️',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    headerBg: 'bg-teal-50/50',
    borderColor: 'border-teal-200',
  },
];

export const DEFAULT_CATEGORY = DRONE_CATEGORIES[0].id;

export function getNormalizedCategory(category?: string): string {
  if (!category) return DRONE_CATEGORIES[0].id;
  const match = DRONE_CATEGORIES.find(c => c.id === category || c.name === category);
  if (match) return match.id;
  
  if (category.includes('کامێرا') && category.includes('2')) return 'درۆن (کامێرا) 2kg';
  if (category.includes('کامێرا') && category.includes('5')) return 'درۆن (کامێرا) 5kg';
  if (category.includes('کامێرا') && category.includes('10')) return 'درۆن (کامێرا) 10kg';
  if (category.includes('GPS') && category.includes('5')) return 'درۆن (GPS) 5kg';
  if (category.includes('GPS') && category.includes('10')) return 'درۆن (GPS) 10kg';
  
  return DRONE_CATEGORIES[0].id;
}
