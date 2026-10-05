import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const CLOUDINARY_LOGO_URL = 'https://res.cloudinary.com/yhj7u0bn/image/upload/v1790602123/asana_sense_logo.png';

async function downloadLogoAndGenerateIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log(`Downloading actual Asana Sense logo from: ${CLOUDINARY_LOGO_URL}...`);
  const response = await fetch(CLOUDINARY_LOGO_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const logoBuffer = Buffer.from(arrayBuffer);

  // Save original master logo
  fs.writeFileSync(path.join(publicDir, 'asana_sense_logo.png'), logoBuffer);
  console.log('✓ Saved master asana_sense_logo.png');

  // 1. 192x192 PNG for PWA & mobile
  await sharp(logoBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 12, g: 10, b: 9, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Generated pwa-192x192.png');

  // 2. 512x512 PNG for PWA splash & desktop
  await sharp(logoBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 12, g: 10, b: 9, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Generated pwa-512x512.png');

  // 3. 512x512 Maskable PNG (with 15% safe padding and dark background)
  const innerSize = Math.round(512 * 0.8); // 410px inner logo inside 512px canvas
  const innerLogo = await sharp(logoBuffer)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 12, g: 10, b: 9, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 6, g: 26, b: 18, alpha: 1 }, // dark emerald obsidian
    },
  })
    .composite([
      {
        input: innerLogo,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Generated pwa-maskable-512x512.png');

  // 4. Apple Touch Icon 180x180 PNG
  await sharp(logoBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 6, g: 26, b: 18, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  // 5. Favicon 32x32 & 48x48
  await sharp(logoBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Generated favicon.ico');

  // 6. Favicon PNG
  await sharp(logoBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Generated favicon.png');

  console.log('All PWA and favicon assets created from actual Cloudinary logo!');
}

downloadLogoAndGenerateIcons().catch(console.error);
