const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

/**
 * electron-builder afterPack hook.
 * Directly edits the Windows PE executable resources (icon & metadata)
 * using rcedit before NSIS packages the app into Setup.exe.
 */
exports.default = async function (context) {
  const { appOutDir, electronPlatformName } = context;
  if (electronPlatformName !== 'win32') return;

  const exePath = path.join(appOutDir, 'BatteryStorageSystem.exe');
  const iconPath = path.join(context.packager.info.projectDir, 'public', 'drone_battery_app_icon.ico');

  console.log(`\n🎨 [afterPack] Setting EXE binary icon with rcedit: ${exePath}`);
  console.log(`   Icon: ${iconPath}`);

  if (fs.existsSync(exePath) && fs.existsSync(iconPath)) {
    try {
      await rcedit(exePath, {
        icon: iconPath,
        'version-string': {
          CompanyName: 'Ahmed M. Salih',
          FileDescription: 'Battery Storage System',
          ProductName: 'Battery Storage System',
          LegalCopyright: 'Copyright © 2026 Ahmed M. Salih. All rights reserved.',
        },
      });
      console.log('  ✅ EXE icon & version metadata successfully embedded into BatteryStorageSystem.exe!\n');
    } catch (err) {
      console.error('  ❌ Failed to set EXE icon via rcedit:', err);
    }
  } else {
    console.warn(`  ⚠️ EXE or icon file not found: exePath=${exePath}, iconPath=${iconPath}`);
  }
};
