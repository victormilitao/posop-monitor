const fs = require('node:fs/promises');
const path = require('node:path');
const ts = require('typescript');
const { PNG } = require('pngjs');
const { generateImageAsync, generateImageBackgroundAsync, compositeImagesAsync } = require('@expo/image-utils');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  // Read the same palette used by the app, without duplicating its colors.
  const paletteSource = await fs.readFile(path.join(projectRoot, 'constants/colors.ts'), 'utf8');
  const compiled = ts.transpileModule(paletteSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const palette = { exports: {} };
  new Function('module', 'exports', compiled)(palette, palette.exports);
  const backgroundColor = palette.exports.AppColors.primary[900];

  // Keep the original transparent logo intact; contain prevents cropping.
  const { source: foreground } = await generateImageAsync({ projectRoot }, {
    src: path.join(projectRoot, 'assets/images/logo.png'),
    width: 800,
    height: 800,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  });
  const background = await generateImageBackgroundAsync({
    width: 1024,
    height: 1024,
    resizeMode: 'contain',
    backgroundColor,
  });
  const icon = await compositeImagesAsync({ foreground, background, x: 112, y: 112 });
  // Encode RGB without an alpha channel for the default iOS/App Store icon.
  const opaqueIcon = PNG.sync.write(PNG.sync.read(icon), { colorType: 2 });
  await fs.writeFile(path.join(projectRoot, 'assets/images/icon.png'), opaqueIcon);
  console.log(`App icon generated: 1024×1024, opaque background ${backgroundColor}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
