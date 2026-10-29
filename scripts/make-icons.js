// Script to generate valid PNG images using node's built-in zlib
import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, innerR, innerG, innerB) {
  // A raw RGBA image buffer
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Check if inside inner rounded rect / center badge
      const margin = Math.floor(width * 0.15);
      const isInner = x >= margin && x < (width - margin) && y >= margin && y < (height - margin);
      const isBar = isInner && y >= margin && y <= (margin + Math.floor(height * 0.12));
      
      if (isBar) {
        rawData[pixelOffset] = 4;     // R (Emerald dark)
        rawData[pixelOffset + 1] = 120; // G
        rawData[pixelOffset + 2] = 87;  // B
        rawData[pixelOffset + 3] = 255;
      } else if (isInner) {
        rawData[pixelOffset] = innerR;
        rawData[pixelOffset + 1] = innerG;
        rawData[pixelOffset + 2] = innerB;
        rawData[pixelOffset + 3] = 255;
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: 6 (RGBA)
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate PWA icons
fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, 5, 150, 105, 255, 255, 255));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, 5, 150, 105, 255, 255, 255));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, 4, 120, 87, 245, 245, 245));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 5, 150, 105, 255, 255, 255));
fs.writeFileSync('public/favicon.ico', createPNG(64, 64, 5, 150, 105, 255, 255, 255));
console.log('PWA PNG icons created successfully!');
