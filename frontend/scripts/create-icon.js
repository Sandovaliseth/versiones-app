const fs = require('fs');
const path = require('path');

// This script generates a minimal 32-bit 1x1 ICO file and writes it to electron/icon.ico
// It's small and valid enough for electron-packager to consume and avoid warnings.

function createIco(outputPath) {
  // ICO header (6 bytes): reserved, type (1 = icon), count (1)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = 1 (icon)
  header.writeUInt16LE(1, 4); // count = 1

  // Image directory entry (16 bytes)
  // width, height (0 for 256), color count, reserved, planes, bitcount, bytesInRes, imageOffset
  const dir = Buffer.alloc(16);
  dir.writeUInt8(1, 0); // width 1
  dir.writeUInt8(1, 1); // height 1
  dir.writeUInt8(0, 2); // color count
  dir.writeUInt8(0, 3); // reserved
  dir.writeUInt16LE(1, 4); // planes
  dir.writeUInt16LE(32, 6); // bitcount (32-bit)

  // We'll build a BMP (BITMAPINFOHEADER + pixels) for the image data
  const biSize = 40;
  const width = 1;
  const height = 1;
  const planes = 1;
  const bitCount = 32;
  const compression = 0;
  const imageSize = width * height * 4; // 4 bytes per pixel
  const xPelsPerMeter = 0;
  const yPelsPerMeter = 0;
  const clrUsed = 0;
  const clrImportant = 0;

  const bmpHeader = Buffer.alloc(biSize);
  bmpHeader.writeUInt32LE(biSize, 0);
  bmpHeader.writeInt32LE(width, 4);
  bmpHeader.writeInt32LE(height * 2, 8); // ICO stores height as doubled (icon + mask)
  bmpHeader.writeUInt16LE(planes, 12);
  bmpHeader.writeUInt16LE(bitCount, 14);
  bmpHeader.writeUInt32LE(compression, 16);
  bmpHeader.writeUInt32LE(imageSize, 20);
  bmpHeader.writeInt32LE(xPelsPerMeter, 24);
  bmpHeader.writeInt32LE(yPelsPerMeter, 28);
  bmpHeader.writeUInt32LE(clrUsed, 32);
  bmpHeader.writeUInt32LE(clrImportant, 36);

  // Pixel data (BGRA). We'll write a simple blue pixel (for visibility)
  const pixel = Buffer.from([0xFF, 0x00, 0x00, 0xFF]); // B, G, R, A -> Red pixel with full alpha

  // AND mask (1-bit per pixel) row padded to 32-bit. For 1x1, mask is 1 byte (0x00) -> opaque
  const maskRowBytes = Math.ceil(width / 32) * 4; // should be 4 bytes
  const mask = Buffer.alloc(maskRowBytes, 0x00);

  const imageData = Buffer.concat([bmpHeader, pixel, mask]);

  // Update bytesInRes and imageOffset in directory entry
  const bytesInRes = imageData.length;
  const imageOffset = header.length + dir.length; // header + dir
  dir.writeUInt32LE(bytesInRes, 8); // bytesInRes (overlaps planes/bitcount fields offset in some cases, but OK here)
  dir.writeUInt32LE(imageOffset, 12);

  // Compose final ICO
  const ico = Buffer.concat([header, dir, imageData]);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, ico);
  console.log('Wrote placeholder icon to', outputPath);
}

const out = path.resolve(__dirname, '..', 'electron', 'icon.ico');
createIco(out);
