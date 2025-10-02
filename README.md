# 🏛️ SLTB Payment Voucher System

**Sri Lanka Tea Board Payment Voucher Desktop Application**

A professional desktop application built with Electron for managing payment vouchers, advance payments, settlements, and petty cash transactions for the Sri Lanka Tea Board.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)
![Electron](https://img.shields.io/badge/Electron-27.0.0-brightgreen)

## ✨ Features

### 🧾 **Voucher Management**
- **4 Voucher Types**: Payment, Advance Payment, Advance Settlement, Petty Cash
- **Auto-Generated Numbers**: Smart voucher numbering system (PV, AP, AS, PC prefixes)
- **Professional PDF Generation**: High-quality PDF output matching official SLTB templates
- **Print Support**: Direct printing capabilities with proper formatting

### 💰 **Financial Calculations**
- **Real-time Calculations**: Automatic subtotal, tax, and total calculations
- **Tax Support**: SSCL and VAT percentage calculations
- **Number Formatting**: Professional number display with space separators (e.g., 1 234 567.89)
- **Amount in Words**: Automatic conversion to English words for certification

### 📄 **Document Management**
- **Document Tracking**: Checkbox system for attached documents
- **Custom Documents**: Text area for additional document notes
- **Approval Workflow**: Multi-level approval system (Prepared, Checked, Recommended, Approved)
- **Compliance**: FR 137 and FR 138 regulatory compliance

### 🎨 **User Experience**
- **Modern Interface**: Clean, professional SLTB-branded design
- **Load Defaults**: Save and load default values for faster form completion
- **Form Validation**: Input validation and error handling
- **Responsive Design**: Optimized for various screen sizes

## 💾 Installation

### Windows Installer (Recommended)
1. Download the latest release: `SLTB Payment Voucher System Setup 1.0.0.exe` (75 MB)
2. Run the installer as Administrator
3. Follow the installation wizard
4. Launch from Desktop shortcut or Start Menu

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/NadeemalTM/SLTB-Voucher-Management-System.git

# Navigate to project directory
cd SLTB-Voucher-Management-System

# Install dependencies
npm install

# Start the application
npm start
```

## 🚀 Usage

### Quick Start
1. **Launch** the application from desktop or start menu
2. **Select** voucher type from the main menu
3. **Fill** in the required information
4. **Generate** voucher number automatically
5. **Add** expenditure details and calculations
6. **Complete** approval workflow
7. **Generate PDF** or print directly

### Development Mode
```bash
npm start
```

### Build for Distribution
```bash
# Build Windows 64-bit installer
npm run build:win64

# Output: dist/SLTB Payment Voucher System Setup 1.0.0.exe
```

## 💻 System Requirements

### End Users (Windows Installer)
- **OS**: Windows 10 (64-bit) or later
- **RAM**: 4 GB minimum
- **Storage**: 100 MB free space
- **Display**: 1024x768 resolution minimum

### Developers
- **Node.js**: 16.x or later
- **npm**: 8.x or later
- **OS**: Windows 10/11 for building Windows installer
- **RAM**: 8 GB recommended
- **Storage**: 500 MB free space

## 📋 Voucher Types

### 1. **Payment Voucher (PV)**
- Standard payment processing
- Multi-line expenditure entries
- Tax calculations (SSCL + VAT)
- Full approval workflow

### 2. **Advance Payment Voucher (AP)**
- Advance payment requests
- Simplified calculation structure
- Approval tracking
- Settlement reference capability

### 3. **Advance Payment Settlement Voucher (AS)**
- Settlement of previously issued advances
- Balance calculations
- Expenditure breakdown
- Compliance documentation

### 4. **Petty Cash Voucher (PC)**
- Small expense management
- Quick processing workflow
- Simplified approval structure
- Daily transaction support

## 🛠️ Project Structure

```
SLTB-Voucher-Management-System/
├── src/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Application styles
│   └── renderer.js         # Main application logic
├── assets/
│   ├── app-icon.ico        # Application icon
│   ├── app-icon-*.png      # Icon variants
│   └── sltb-logo.*         # SLTB logos
├── main.js                 # Electron main process
├── package.json            # Project configuration
└── README.md               # This file
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

## 🤝 Contributing

We welcome contributions to improve the SLTB Payment Voucher System!

### How to Contribute
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Reporting Issues
- Use the GitHub Issues tab
- Provide detailed description of the problem
- Include steps to reproduce
- Attach screenshots if applicable

## 📄 Version History

**v1.0.0** (October 2025)
- ✅ Initial release with all 4 voucher types
- ✅ Professional PDF generation with SLTB templates
- ✅ Windows installer with custom icon (75 MB)
- ✅ Number formatting with space separators
- ✅ Amount-in-words conversion
- ✅ Load defaults functionality
- ✅ Complete approval workflow
- ✅ SLTB branding integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Contact
- **Organization**: Sri Lanka Tea Board - IT Division
- **GitHub**: [@NadeemalTM](https://github.com/NadeemalTM)
- **Repository**: [SLTB-Voucher-Management-System](https://github.com/NadeemalTM/SLTB-Voucher-Management-System)

### Known Issues
- GPU warnings on some Windows systems (cosmetic, doesn't affect functionality)
- Large PDF files may take a few seconds to generate

---

## 🏛️ About Sri Lanka Tea Board

The Sri Lanka Tea Board is the apex body for the tea industry in Sri Lanka, established under the Sri Lanka Tea Board Law No. 14 of 1975. This application supports the board's financial management and administrative processes.

**Built with ❤️ for Sri Lanka Tea Board**

*© 2025 Sri Lanka Tea Board. All rights reserved.*