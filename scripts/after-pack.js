const path = require('path');
const fs = require('fs');

/**
 * electron-builder afterPack hook.
 * Directly edits the Windows PE executable resources (icon & metadata)
 * using rcedit before NSIS packages the app into Setup.exe.
 */
module.exports = async function (context) {
  const { appOutDir, electronPlatformName } = context;
  if (electronPlatformName !== 'win32') return;

  const iconPath = path.join(context.packager.info.projectDir, 'public', 'drone_battery_app_icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.warn(`  ⚠️ Icon file not found: ${iconPath}`);
    return;
  }

  const files = fs.readdirSync(appOutDir);
  const exeFiles = files.filter(f => f.endsWith('.exe') && !f.toLowerCase().includes('elevate'));

  for (const exeName of exeFiles) {
    const exePath = path.join(appOutDir, exeName);
    console.log(`\n🎨 [afterPack] Setting EXE binary icon with rcedit: ${exePath}`);
    console.log(`   Icon: ${iconPath}`);

    try {
      const { rcedit } = await import('rcedit');
      await rcedit(exePath, {
        icon: iconPath,
        'version-string': {
          CompanyName: 'Ahmed M. Salih',
          FileDescription: 'Battery Storage System',
          ProductName: 'Battery Storage System',
          LegalCopyright: 'Copyright © 2026 Ahmed M. Salih. All rights reserved.',
        },
      });
      console.log(`  ✅ EXE icon & version metadata successfully embedded into ${exeName}!\n`);
    } catch (err) {
      console.error(`  ❌ Failed to set EXE icon via rcedit for ${exeName}:`, err);
    }
  }
};

