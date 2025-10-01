const fs = require('fs');
const path = require('path');

// Create a proper ICO-compatible PNG (256x256 maximum for compatibility)
function createWindowsCompatibleIcon() {
    // Professional SLTB logo in proper Windows icon format (256x256)
    const iconBase64 = `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`;
    
    const buffer = Buffer.from(iconBase64, 'base64');
    
    // Save as windows-icon.png (256x256)
    fs.writeFileSync(path.join(__dirname, 'windows-icon.png'), buffer);
    
    console.log('✅ Windows-compatible icon created (256x256)!');
    
    // Also create a simple ICO header manually for better compatibility
    createSimpleIco(buffer);
}

function createSimpleIco(pngBuffer) {
    try {
        // Create a very basic ICO file structure
        // ICO files start with a 6-byte header, followed by icon directory entries
        
        const icoHeader = Buffer.alloc(6);
        icoHeader.writeUInt16LE(0, 0);    // Reserved (must be 0)
        icoHeader.writeUInt16LE(1, 2);    // Type (1 for ICO)
        icoHeader.writeUInt16LE(1, 4);    // Number of images
        
        // Directory entry (16 bytes)
        const dirEntry = Buffer.alloc(16);
        dirEntry.writeUInt8(0, 0);        // Width (0 = 256)
        dirEntry.writeUInt8(0, 1);        // Height (0 = 256)
        dirEntry.writeUInt8(0, 2);        // Colors (0 = no palette)
        dirEntry.writeUInt8(0, 3);        // Reserved
        dirEntry.writeUInt16LE(1, 4);     // Planes
        dirEntry.writeUInt16LE(32, 6);    // Bits per pixel
        dirEntry.writeUInt32LE(pngBuffer.length, 8);  // Image size
        dirEntry.writeUInt32LE(22, 12);   // Offset to image data (6 + 16)
        
        // Combine header, directory, and PNG data
        const icoBuffer = Buffer.concat([icoHeader, dirEntry, pngBuffer]);
        
        fs.writeFileSync(path.join(__dirname, 'app-icon.ico'), icoBuffer);
        console.log('✅ ICO file created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating ICO:', error.message);
    }
}

createWindowsCompatibleIcon();