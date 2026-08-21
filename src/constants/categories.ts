/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DroneCategoryInfo {
  id: string;
  name: string;
  type: 'CAMERA' | 'GPS' | 'FPV' | 'CARGO' | 'CUSTOM' | string;
  typeLabel: string;
  weight: string;
  icon: string;
  badgeColor: string;
  headerBg: string;
  borderColor: string;
  isCustom?: boolean;
}

export const DEFAULT_DRONE_CATEGORIES: DroneCategoryInfo[] = [
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
    isCustom: false,
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
    isCustom: false,
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
    isCustom: false,
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
    isCustom: false,
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
    isCustom: false,
  },
];

export const CATEGORIES_STORAGE_KEY = 'kurdish_battery_categories_v1';

/**
 * Load categories from localStorage, combining with default categories
 */
export function loadCategories(): DroneCategoryInfo[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_DRONE_CATEGORIES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_DRONE_CATEGORIES];
  } catch (e) {
    console.error('Error loading categories:', e);
    return [...DEFAULT_DRONE_CATEGORIES];
  }
}

/**
 * Save categories to localStorage
 */
export function saveCategories(categories: DroneCategoryInfo[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

/**
 * Add a new drone category
 */
export function addCustomCategory(newCat: {
  name: string;
  type?: string;
  typeLabel?: string;
  weight?: string;
}): DroneCategoryInfo[] {
  const current = loadCategories();
  const trimmedName = newCat.name.trim();
  if (!trimmedName) return current;

  // Check if exists
  const existing = current.find((c) => c.id === trimmedName || c.name.toLowerCase() === trimmedName.toLowerCase());
  if (existing) return current;

  const type = newCat.type || 'CUSTOM';
  const typeLabel = newCat.typeLabel?.trim() || (type === 'CAMERA' ? 'کامێرا' : type === 'GPS' ? 'GPS' : type === 'FPV' ? 'FPV' : type === 'CARGO' ? 'بارهەڵگر' : 'تایبەت');
  const weight = newCat.weight?.trim() || 'تایبەت';

  const categoryItem: DroneCategoryInfo = {
    id: trimmedName,
    name: trimmedName,
    type,
    typeLabel,
    weight,
    icon: type === 'CAMERA' ? '📷' : type === 'GPS' ? '🛰️' : '🛸',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    headerBg: 'bg-slate-50/50',
    borderColor: 'border-slate-200',
    isCustom: true,
  };

  const updated = [...current, categoryItem];
  saveCategories(updated);
  return updated;
}

/**
 * Update an existing category
 */
export function updateCategory(
  categoryId: string,
  updatedData: {
    name: string;
    type?: string;
    typeLabel?: string;
    weight?: string;
  }
): { categories: DroneCategoryInfo[]; oldId: string; newId: string } {
  const current = loadCategories();
  const trimmedName = updatedData.name.trim();
  const target = current.find((c) => c.id === categoryId);
  if (!target) return { categories: current, oldId: categoryId, newId: categoryId };

  const newId = trimmedName || target.id;
  const type = updatedData.type || target.type || 'CUSTOM';
  const typeLabel =
    updatedData.typeLabel?.trim() ||
    (type === 'CAMERA'
      ? 'کامێرا'
      : type === 'GPS'
      ? 'GPS'
      : type === 'FPV'
      ? 'FPV'
      : type === 'CARGO'
      ? 'بارهەڵگر'
      : 'تایبەت');
  const weight = updatedData.weight !== undefined ? updatedData.weight.trim() : target.weight;

  const updatedCategories = current.map((cat) => {
    if (cat.id === categoryId) {
      return {
        ...cat,
        id: newId,
        name: trimmedName || cat.name,
        type,
        typeLabel,
        weight,
        icon: type === 'CAMERA' ? '📷' : type === 'GPS' ? '🛰️' : '🛸',
      };
    }
    return cat;
  });

  saveCategories(updatedCategories);
  return { categories: updatedCategories, oldId: categoryId, newId };
}

/**
 * Delete a category by id
 */
export function deleteCustomCategory(categoryId: string): DroneCategoryInfo[] {
  const current = loadCategories();
  const updated = current.filter((c) => c.id !== categoryId);
  saveCategories(updated);
  return updated;
}

export const DRONE_CATEGORIES = DEFAULT_DRONE_CATEGORIES;
export const DEFAULT_CATEGORY = DEFAULT_DRONE_CATEGORIES[0].id;

export function getNormalizedCategory(category?: string, categoriesList?: DroneCategoryInfo[]): string {
  if (!category) return DEFAULT_DRONE_CATEGORIES[0].id;

  const list = categoriesList || loadCategories();
  const match = list.find((c) => c.id === category || c.name === category);
  if (match) return match.id;

  if (category.includes('کامێرا') && category.includes('2')) return 'درۆن (کامێرا) 2kg';
  if (category.includes('کامێرا') && category.includes('5')) return 'درۆن (کامێرا) 5kg';
  if (category.includes('کامێرا') && category.includes('10')) return 'درۆن (کامێرا) 10kg';
  if (category.includes('GPS') && category.includes('5')) return 'درۆن (GPS) 5kg';
  if (category.includes('GPS') && category.includes('10')) return 'درۆن (GPS) 10kg';

  // Return custom category name as-is
  return category.trim();
}
