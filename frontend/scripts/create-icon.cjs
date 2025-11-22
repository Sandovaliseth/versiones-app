const fs = require('fs');
const path = require('path');

const size = 64;

const bgStart = { r: 15, g: 23, b: 42 };
const bgEnd = { r: 30, g: 58, b: 138 };
const accentStart = { r: 56, g: 189, b: 248 };
const accentEnd = { r: 168, g: 85, b: 247 };

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

function colorForPixel(x, y) {
  const gradientT = (x + y) / (2 * (size - 1));
  let r = lerp(bgStart.r, bgEnd.r, gradientT);
  let g = lerp(bgStart.g, bgEnd.g, gradientT);
  let b = lerp(bgStart.b, bgEnd.b, gradientT);
  const a = 255;

  const normalizedY = Math.min(1, Math.max(0, (y - 8) / (size - 16)));
  const leftX = 14 + normalizedY * 18;
  const rightX = 50 - normalizedY * 18;
  const thickness = 2.5 + (1 - normalizedY) * 1.5;
  const accentT = normalizedY;
  const accentR = lerp(accentStart.r, accentEnd.r, accentT);
  const accentG = lerp(accentStart.g, accentEnd.g, accentT);
  const accentB = lerp(accentStart.b, accentEnd.b, accentT);

  const onLeft = y >= 8 && y <= size - 10 && Math.abs(x - leftX) <= thickness;
  const onRight = y >= 8 && y <= size - 10 && Math.abs(x - rightX) <= thickness;
  const bottomStart = size - 18;
  const onBottom = y >= bottomStart && Math.abs(x - size / 2) <= 3 + ((y - bottomStart) / 4);

  if (onLeft || onRight || onBottom) {
    r = accentR;
    g = accentG;
    b = accentB;
  }

  const circleDx = x - size / 2;
  const circleDy = y - (size / 2 + 2);
  if (circleDx * circleDx + circleDy * circleDy <= 25) {
    r = 252;
    g = 211;
    b = 77;
  }

  return { r, g, b, a };
}

function createIco(outputPath) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const dir = Buffer.alloc(16);
  dir.writeUInt8(size, 0);
  dir.writeUInt8(size, 1);
  dir.writeUInt8(0, 2);
  dir.writeUInt8(0, 3);
  dir.writeUInt16LE(1, 4);
  dir.writeUInt16LE(32, 6);

  const biSize = 40;
  const planes = 1;
  const bitCount = 32;
  const compression = 0;
  const pixelBytes = size * size * 4;
  const maskRowBytes = Math.ceil(size / 32) * 4;
  const mask = Buffer.alloc(maskRowBytes * size, 0x00);

  const bmpHeader = Buffer.alloc(biSize);
  bmpHeader.writeUInt32LE(biSize, 0);
  bmpHeader.writeInt32LE(size, 4);
  bmpHeader.writeInt32LE(size * 2, 8);
  bmpHeader.writeUInt16LE(planes, 12);
  bmpHeader.writeUInt16LE(bitCount, 14);
  bmpHeader.writeUInt32LE(compression, 16);
  bmpHeader.writeUInt32LE(pixelBytes + mask.length, 20);
  bmpHeader.writeInt32LE(0, 24);
  bmpHeader.writeInt32LE(0, 28);
  bmpHeader.writeUInt32LE(0, 32);
  bmpHeader.writeUInt32LE(0, 36);

  const pixelBuffer = Buffer.alloc(pixelBytes);
  let offset = 0;
  for (let y = size - 1; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      const { r, g, b, a } = colorForPixel(x, y);
      pixelBuffer[offset++] = b;
      pixelBuffer[offset++] = g;
      pixelBuffer[offset++] = r;
      pixelBuffer[offset++] = a;
    }
  }

  const imageData = Buffer.concat([bmpHeader, pixelBuffer, mask]);
  const bytesInRes = imageData.length;
  const imageOffset = header.length + dir.length;
  dir.writeUInt32LE(bytesInRes, 8);
  dir.writeUInt32LE(imageOffset, 12);

  const ico = Buffer.concat([header, dir, imageData]);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, ico);
  console.log('🎨 Icono generado en', outputPath);
}

const out = path.resolve(__dirname, '..', 'electron', 'icon.ico');
createIco(out);
