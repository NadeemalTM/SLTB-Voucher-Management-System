const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

// Create a high-resolution SLTB logo (512x512)
function createSLTBLogo() {
    // Create a canvas-like approach using SVG then convert to PNG
    const svgContent = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E7D32;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="256" cy="256" r="240" fill="url(#gradient)" stroke="#1B5E20" stroke-width="8"/>
  
  <!-- Tea Leaf Shape -->
  <path d="M 180 180 Q 200 160 240 180 Q 280 200 300 240 Q 320 280 300 320 Q 280 340 240 320 Q 200 300 180 260 Q 160 220 180 180 Z" 
        fill="#81C784" stroke="#2E7D32" stroke-width="3"/>
  
  <!-- SLTB Text Background -->
  <rect x="156" y="320" width="200" height="80" rx="10" fill="white" fill-opacity="0.9" stroke="#2E7D32" stroke-width="2"/>
  
  <!-- SLTB Text -->
  <text x="256" y="350" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#2E7D32">SLTB</text>
  <text x="256" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#1B5E20">Payment Voucher</text>
  
  <!-- Decorative Elements -->
  <circle cx="220" cy="200" r="8" fill="#A5D6A7"/>
  <circle cx="280" cy="220" r="6" fill="#A5D6A7"/>
  <circle cx="260" cy="280" r="10" fill="#A5D6A7"/>
</svg>`;

    // Save SVG file
    fs.writeFileSync(path.join(__dirname, 'app-icon.svg'), svgContent);
    console.log('✅ High-resolution SVG icon created!');
    
    return svgContent;
}

// Create a PNG version using Canvas (Node.js approach)
function createPNGFromSVG() {
    // For now, create a simple but high-quality PNG programmatically
    // This creates a base64 encoded 512x512 PNG with SLTB branding
    
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const width = 512;
    const height = 512;
    const canvasElement = createCanvas(width, height);
    const ctx = canvasElement.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2E7D32');
    gradient.addColorStop(1, '#4CAF50');
    
    // Draw background circle
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#1B5E20';
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Draw tea leaf shape
    ctx.beginPath();
    ctx.fillStyle = '#81C784';
    ctx.ellipse(256, 220, 80, 50, Math.PI / 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw text background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.roundRect(156, 320, 200, 80, 10);
    ctx.fill();
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw SLTB text
    ctx.fillStyle = '#2E7D32';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SLTB', 256, 350);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#1B5E20';
    ctx.fillText('Payment Voucher', 256, 380);
    
    // Add decorative dots
    ctx.fillStyle = '#A5D6A7';
    ctx.beginPath();
    ctx.arc(220, 200, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(280, 220, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(260, 280, 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Save as PNG
    const buffer = canvasElement.toBuffer('image/png');
    fs.writeFileSync(path.join(__dirname, 'app-icon-512.png'), buffer);
    console.log('✅ High-resolution PNG icon (512x512) created!');
    
    return buffer;
}

// Alternative: Create a simple but professional logo without canvas dependency
function createSimplePNG() {
    // Create a more basic but valid PNG data URL for a 512x512 icon
    // This is a green circle with SLTB text - simple but recognizable
    
    const svgContent = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" fill="#f8f9fa"/>
  
  <!-- Main Circle -->
  <circle cx="256" cy="256" r="200" fill="#2e7d32" stroke="#1b5e20" stroke-width="8"/>
  
  <!-- Inner Circle -->
  <circle cx="256" cy="256" r="160" fill="#4caf50" fill-opacity="0.8"/>
  
  <!-- Tea Leaf -->
  <ellipse cx="256" cy="200" rx="60" ry="30" fill="#81c784" transform="rotate(15 256 200)"/>
  <ellipse cx="256" cy="200" rx="40" ry="20" fill="#a5d6a7" transform="rotate(15 256 200)"/>
  
  <!-- Text Background -->
  <rect x="176" y="280" width="160" height="60" rx="8" fill="white" fill-opacity="0.95"/>
  
  <!-- SLTB Text -->
  <text x="256" y="310" text-anchor="middle" font-family="Arial Black, Arial" font-size="28" font-weight="bold" fill="#1b5e20">SLTB</text>
  <text x="256" y="330" text-anchor="middle" font-family="Arial" font-size="12" fill="#2e7d32">PAYMENT SYSTEM</text>
  
  <!-- Decorative dots -->
  <circle cx="200" cy="180" r="4" fill="#a5d6a7"/>
  <circle cx="312" cy="190" r="6" fill="#a5d6a7"/>
  <circle cx="280" cy="320" r="3" fill="#81c784"/>
</svg>`;

    // Save the SVG
    fs.writeFileSync(path.join(__dirname, 'app-icon.svg'), svgContent);
    console.log('✅ Professional SVG icon created!');
    
    return svgContent;
}

// Main execution
async function createIcons() {
    try {
        console.log('🎨 Creating SLTB Payment Voucher icons...');
        
        // Method 1: Try to use canvas if available
        try {
            createPNGFromSVG();
        } catch (error) {
            console.log('Canvas not available, using SVG method...');
            createSimplePNG();
        }
        
        // Create different sizes for Windows ICO
        // For now, let's create the icon files we need
        
        console.log('✅ Icons created successfully!');
        console.log('📁 Files created:');
        console.log('  - app-icon.svg (vector format)');
        if (fs.existsSync(path.join(__dirname, 'app-icon-512.png'))) {
            console.log('  - app-icon-512.png (512x512 raster)');
        }
        
    } catch (error) {
        console.error('❌ Error creating icons:', error.message);
    }
}

// Run the icon creation
createIcons();