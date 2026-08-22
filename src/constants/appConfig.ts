/**
 * Application Configuration
 * Official GitHub Repository configuration for automatic update checks.
 */
export const APP_CONFIG = {
  /**
   * Official GitHub Repository in 'owner/repository' format.
   */
  GITHUB_REPO: 'amdakalar/Battery-Storage-System',
  APP_NAME_EN: 'Battery Storage System',
  APP_NAME_KU: 'سیستەمی بەڕێوەبردنی ستۆرج',
  CURRENT_VERSION: '1.0.11',
};

export function cleanVersion(v?: string): string {
  if (!v) return '0.0.0';
  return v.replace(/^v/i, '').trim();
}

export function isNewerVersion(latest?: string, current?: string): boolean {
  if (!latest) return false;
  const lParts = cleanVersion(latest).split('.').map((n) => parseInt(n, 10) || 0);
  const cParts = cleanVersion(current || APP_CONFIG.CURRENT_VERSION).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(lParts.length, cParts.length); i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}
