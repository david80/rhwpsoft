// 로고 SVG에서 앱 아이콘과 파비콘을 만듭니다. (macOS 전용: iconutil 사용)
// 사용: env -u ELECTRON_RUN_AS_NODE npx electron scripts/build-icons.cjs
const { app, BrowserWindow } = require('electron');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BRAND = path.join(ROOT, 'public/brand');
const BUILD = path.join(ROOT, 'build');
const LOGO = fs.readFileSync(path.join(BRAND, 'studio-logo.svg'), 'utf8');
const LOGO_SMALL = fs.readFileSync(path.join(BRAND, 'studio-logo-small.svg'), 'utf8');
// macOS 아이콘 규격: 1024 캔버스에 824 타일
const MAC_MARGIN = 100 / 1024;

let win;

// 16px은 ㅎ이 뭉개지므로 단순형을 여백 없이 쓴다
function render(size, margin = 0) {
  const small = size <= 16;
  const svg = `data:image/svg+xml;base64,${Buffer.from(small ? LOGO_SMALL : LOGO).toString('base64')}`;
  const inset = small ? 0 : size * margin;
  return win.webContents.executeJavaScript(`(async () => {
    const image = new Image();
    image.width = image.height = ${size};
    image.src = ${JSON.stringify(svg)};
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ${size};
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, ${inset}, ${inset}, ${size - inset * 2}, ${size - inset * 2});
    const png = canvas.toDataURL('image/png').split(',')[1];
    return { size: ${size}, png, rgba: Array.from(ctx.getImageData(0, 0, ${size}, ${size}).data) };
  })()`);
}

// 256px은 PNG, 그보다 작은 크기는 호환성을 위해 32비트 BMP로 담는다
function icoImage({ size, png, rgba }) {
  if (size >= 256) return Buffer.from(png, 'base64');
  const maskRow = Math.ceil(size / 32) * 4;
  const image = Buffer.alloc(40 + size * size * 4 + maskRow * size);
  image.writeUInt32LE(40, 0);
  image.writeInt32LE(size, 4);
  image.writeInt32LE(size * 2, 8);
  image.writeUInt16LE(1, 12);
  image.writeUInt16LE(32, 14);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const src = ((size - 1 - y) * size + x) * 4;
      const dst = 40 + (y * size + x) * 4;
      image[dst] = rgba[src + 2];
      image[dst + 1] = rgba[src + 1];
      image[dst + 2] = rgba[src];
      image[dst + 3] = rgba[src + 3];
    }
  }
  return image;
}

function ico(entries) {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const images = entries.map(icoImage);
  let offset = header.length;
  entries.forEach(({ size }, i) => {
    const at = 6 + i * 16;
    header[at] = header[at + 1] = size % 256;
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(images[i].length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += images[i].length;
  });
  return Buffer.concat([header, ...images]);
}

function writePng(file, { png }) {
  fs.writeFileSync(file, Buffer.from(png, 'base64'));
}

async function main() {
  win = new BrowserWindow({ show: false });
  await win.loadURL('about:blank');

  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rhwp-icons-'));
  const iconset = path.join(work, 'icon.iconset');
  fs.mkdirSync(iconset);
  for (const size of [16, 32, 128, 256, 512]) {
    writePng(path.join(iconset, `icon_${size}x${size}.png`), await render(size, MAC_MARGIN));
    writePng(path.join(iconset, `icon_${size}x${size}@2x.png`), await render(size * 2, MAC_MARGIN));
  }
  execFileSync('iconutil', ['-c', 'icns', '-o', path.join(BUILD, 'icon.icns'), iconset]);
  fs.rmSync(work, { recursive: true });

  const icoEntries = [];
  for (const size of [16, 24, 32, 48, 64, 128, 256]) icoEntries.push(await render(size));
  fs.writeFileSync(path.join(BUILD, 'icon.ico'), ico(icoEntries));

  writePng(path.join(BUILD, 'icon.png'), await render(1024, MAC_MARGIN));
  writePng(path.join(BRAND, 'favicon-16.png'), await render(16));
  writePng(path.join(BRAND, 'favicon-32.png'), await render(32));
}

app.whenReady().then(main).then(
  () => app.exit(0),
  (error) => {
    console.error(error);
    app.exit(1);
  },
);
