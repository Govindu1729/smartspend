const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// A simple green ₹ symbol on dark slate background SVG
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0f172a" rx="100" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="300" font-weight="bold" fill="#22c55e">₹</text>
</svg>
`;

const sizes = [512, 192, 180, 32];
for (const size of sizes) {
  const fileName = size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`;
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(iconsDir, fileName));
  console.log(`Generated ${fileName}`);
}