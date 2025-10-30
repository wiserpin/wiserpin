import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/icons/icon.svg');
const outputDir = resolve(__dirname, '../public/icons');

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  const svgBuffer = readFileSync(svgPath);

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`${outputDir}/icon-${size}.png`);

    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
