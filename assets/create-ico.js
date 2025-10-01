const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function createIcoFile() {
    try {
        console.log('🎨 Converting PNG to ICO format...');
        
        // Read the 512x512 PNG file
        const input = fs.readFileSync(path.join(__dirname, 'app-icon-512.png'));
        
        // Convert to ICO
        const ico = await toIco([input]);
        
        // Save as ICO file
        fs.writeFileSync(path.join(__dirname, 'app-icon.ico'), ico);
        
        console.log('✅ ICO file created successfully!');
        console.log('📁 Created: app-icon.ico');
        
    } catch (error) {
        console.error('❌ Error creating ICO file:', error.message);
    }
}

createIcoFile();