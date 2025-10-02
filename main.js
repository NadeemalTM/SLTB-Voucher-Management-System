const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets', 'app-icon.ico'),
        title: 'SLTB Payment Voucher System'
    });

    mainWindow.loadFile('src/index.html');

    // Create menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Voucher',
                    submenu: [
                        {
                            label: 'Payment Voucher',
                            click: () => {
                                mainWindow.webContents.send('load-voucher', 'payment');
                            }
                        },
                        {
                            label: 'Advance Payment Voucher',
                            click: () => {
                                mainWindow.webContents.send('load-voucher', 'advance-payment');
                            }
                        },
                        {
                            label: 'Advance Payment Settlement Voucher',
                            click: () => {
                                mainWindow.webContents.send('load-voucher', 'advance-settlement');
                            }
                        },
                        {
                            label: 'Petty Cash Voucher',
                            click: () => {
                                mainWindow.webContents.send('load-voucher', 'petty-cash');
                            }
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About SLTB Payment Voucher System',
                            message: 'SLTB Payment Voucher System v1.0.0',
                            detail: 'Developed by Nadeemal TM IT Division\\nSri Lanka Tea Board Payment Voucher Management System'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// Handle IPC messages
ipcMain.handle('save-voucher-data', async (event, data) => {
    try {
        const documentsPath = app.getPath('documents');
        const voucherDir = path.join(documentsPath, 'SLTB_Vouchers');
        
        if (!fs.existsSync(voucherDir)) {
            fs.mkdirSync(voucherDir, { recursive: true });
        }

        const fileName = `voucher_${data.type}_${Date.now()}.json`;
        const filePath = path.join(voucherDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return { success: true, path: filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-voucher-data', async (event) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const data = fs.readFileSync(result.filePaths[0], 'utf8');
            return { success: true, data: JSON.parse(data) };
        }
        return { success: false, error: 'No file selected' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});