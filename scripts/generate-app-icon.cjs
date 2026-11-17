const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
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

  // The original artwork ends above row 500; the wordmark starts at row 633.
  // Crop only the icon source, preserving the full logo used inside the app.
  const original = PNG.sync.read(await fs.readFile(path.join(projectRoot, 'assets/images/logo.png')));
  const symbol = new PNG({ width: original.width, height: 500 });
  PNG.bitblt(original, symbol, 0, 0, original.width, 500, 0, 0);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'posop-icon-'));
  let foreground;
  try {
    const symbolPath = path.join(tempDir, 'symbol.png');
    await fs.writeFile(symbolPath, PNG.sync.write(symbol));
    ({ source: foreground } = await generateImageAsync({ projectRoot }, {
      src: symbolPath,
      width: 800,
      height: 800,
      resizeMode: 'contain',
      backgroundColor: 'transparent',
    }));
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
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
