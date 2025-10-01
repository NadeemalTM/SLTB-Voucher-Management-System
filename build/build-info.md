# SLTB Payment Voucher System - Build Instructions

## System Requirements
- Windows 10 or later
- 4 GB RAM minimum
- 100 MB free disk space

## Build Process
This application is built using Electron and packaged with electron-builder.

## Installation Features
- Professional Windows installer (NSIS)
- Desktop shortcut creation
- Start menu integration
- Automatic updates support
- Clean uninstallation

## File Structure
- Main executable: SLTB Payment Voucher System.exe
- Application data stored in user's AppData folder
- PDF outputs saved to Documents/SLTB_Vouchers/

## Security
- Code signing ready (certificate required for production)
- Windows SmartScreen compatible
- No elevated privileges required for normal operation

## Build Date: $(date)
## Version: 1.0.0