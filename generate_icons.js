// scripts/generate-icons.js
const fs = require('fs');
const path = require('path');

// Simple SVG icons as base
const iconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f172a"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial" font-size="${size/4}" font-weight="bold" fill="#22c55e">
    ₹
  </text>
</svg>`;

// Note: This is a placeholder. In production, use actual PNG files.
console.log('Place icons in public/icons/');
console.log('Required: icon-192x192.png, icon-512x512.png');