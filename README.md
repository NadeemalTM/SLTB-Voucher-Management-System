# SLTB Payment Voucher System

A desktop application built with Electron for managing Sri Lanka Tea Board payment vouchers.

## Features

- **Multiple Voucher Types:**
  - Payment Voucher
  - Advance Payment Voucher
  - Advance Payment Settlement Voucher
  - Petty Cash Voucher

- **Key Functionality:**
  - Form-based data entry with validation
  - Auto-calculation of totals and taxes
  - PDF generation for printing
  - Data saving and loading
  - Default settings management
  - Professional voucher formatting

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Development Mode
```
npm start
```

### Build for Distribution
```
npm run build
```

### Create Installer Package
```
npm run dist
```

## System Requirements

- Node.js 16 or higher
- Windows 10/11 (primary target)
- 4GB RAM minimum
- 500MB disk space

## Project Structure

```
sltb-payment-voucher-system/
├── main.js                 # Main Electron process
├── package.json           # Project configuration
├── src/
│   ├── index.html         # Main UI
│   ├── styles.css         # Application styles
│   └── renderer.js        # Frontend logic
├── assets/
│   ├── icon.png          # App icon (placeholder)
│   └── sltb-logo.png     # SLTB logo (placeholder)
└── README.md
```

## Features Overview

### 1. Welcome Page
- Overview of all voucher types
- Quick navigation to forms
- System guidelines

### 2. Default Settings
- Save frequently used information
- Auto-populate forms with defaults
- Customizable per user

### 3. Payment Voucher, Advance Payment, Settlement & Petty Cash Vouchers
- **Unified Interface**: All voucher types now have identical structure
- Multiple expenditure line items with dynamic table
- Automatic tax calculations (SSCL VAT, VAT)
- Detailed approval workflow (6 approval levels)
- Document attachment checklist
- Professional PDF generation matching official SLTB templates
- Load Defaults functionality across all forms

### 7. PDF Generation
- Professional voucher formatting
- Print-ready output
- Automatic file naming
- Save to Documents folder

## Usage Instructions

1. **Starting the Application:**
   - Launch the application
   - Select desired voucher type from navigation or welcome cards

2. **Default Settings:**
   - Go to "Default Settings" to configure frequently used data
   - Save settings to auto-populate forms

3. **Creating a Voucher:**
   - Fill in required fields (marked with *)
   - Add expenditure details (for payment vouchers)
   - Complete approval information
   - Check relevant document attachments

4. **Generating Voucher Number:**
   - Click "Generate Voucher Number" for unique identifier
   - Format: SLTB-[TYPE]-[YYYYMMDD]-[HHMM]

5. **Saving and Loading:**
   - Save completed vouchers as JSON files
   - Load previously saved vouchers for editing
   - Files saved to Documents/SLTB_Vouchers folder

6. **PDF Generation:**
   - Click "Generate PDF" to create printable document
   - PDF includes all form data and calculations
   - Automatically formatted for official use

7. **Printing:**
   - Use "Print" button for direct printing
   - Print preview available through browser print dialog

## Data Management

- **Local Storage:** Default settings saved in browser storage
- **File System:** Voucher data saved as JSON files
- **PDF Output:** Generated PDFs saved to user's Documents folder

## Troubleshooting

### Common Issues:

1. **Application won't start:**
   - Ensure Node.js is installed
   - Run `npm install` to install dependencies
   - Check for error messages in terminal

2. **PDF generation fails:**
   - Check internet connection (for CDN resources)
   - Ensure all required fields are filled
   - Try refreshing the application

3. **Data not saving:**
   - Check file permissions in Documents folder
   - Ensure sufficient disk space
   - Verify antivirus isn't blocking file operations

## Development

### Built With:
- **Electron** - Desktop application framework
- **HTML/CSS/JavaScript** - Frontend technologies
- **jsPDF** - PDF generation library
- **Electron Store** - Data persistence

### Adding New Features:
1. Modify renderer.js for frontend functionality
2. Update main.js for backend/system integration
3. Add new CSS classes in styles.css for styling
4. Test thoroughly before building

## Version History

- **v1.0.0** - Initial release
  - All four voucher types
  - PDF generation
  - Data saving/loading
  - Default settings

## License

This project is developed for Sri Lanka Tea Board internal use.

## Support

For technical support or feature requests, contact the SLTB IT Division.

---

**Developed by Nadeemal TM - IT Division**  
**Sri Lanka Tea Board**  
**© 2024**