const { ipcRenderer } = require('electron');

// Global variables
let currentVoucherType = 'welcome';
let expenditureCount = 0;
let defaultSettings = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application initializing...');
    
    // Load defaults first thing
    loadDefaults();
    console.log('Defaults loaded on startup:', defaultSettings);
    
    // Load welcome page
    loadVoucherForm('welcome');
    
    // Listen for menu events
    ipcRenderer.on('load-voucher', (event, voucherType) => {
        loadVoucherForm(voucherType);
    });
    
    console.log('Application initialized successfully');
});

// Load default settings
function loadDefaults() {
    try {
        const stored = localStorage.getItem('sltb-defaults');
        if (stored) {
            defaultSettings = JSON.parse(stored);
            console.log('Loaded default settings:', defaultSettings);
        } else {
            console.log('No stored default settings found');
            defaultSettings = {};
        }
    } catch (error) {
        console.error('Error loading default settings:', error);
        defaultSettings = {};
    }
}

// Populate defaults form
function populateDefaultsForm() {
    const form = document.getElementById('defaults-form');
    if (!form) return;
    
    // Clear the form first
    form.reset();
    
    // Populate with saved defaults
    Object.keys(defaultSettings).forEach(key => {
        let element = form.querySelector(`[name="${key}"]`);
        
        // Try different ID patterns
        if (!element) {
            element = form.querySelector(`#default-${key}`);
        }
        if (!element) {
            // Handle kebab-case IDs (like default-file-reference)
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            element = form.querySelector(`#default-${kebabKey}`);
        }
        
        if (element) {
            element.value = defaultSettings[key] || '';
            console.log(`Loaded default value for ${key}:`, defaultSettings[key]);
        }
    });
}

// Load and populate defaults for the defaults page
function loadAndPopulateDefaults() {
    // Always reload from storage to get latest
    loadDefaults();
    populateDefaultsForm();
}

// Save default settings
function saveDefaults() {
    const form = document.getElementById('defaults-form');
    if (!form) {
        showMessage('Error: Default settings form not found!', 'error');
        return;
    }
    
    const formData = new FormData(form);
    
    defaultSettings = {};
    let savedCount = 0;
    
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') { // Only save non-empty values
            defaultSettings[key] = value.trim();
            savedCount++;
        }
    }
    
    console.log('Saving default settings:', defaultSettings);
    localStorage.setItem('sltb-defaults', JSON.stringify(defaultSettings));
    
    // Show success message with details
    const statusDiv = document.getElementById('defaults-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<div class="message success">
            <strong>Default settings saved successfully!</strong><br>
            ${savedCount} values saved. These will now auto-fill in voucher forms.<br>
            <small>Try creating a voucher to see the auto-fill in action!</small>
        </div>`;
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 8000);
    }
    
    showMessage(`Default settings saved! ${savedCount} values will auto-fill in forms.`, 'success');
}

// Clear all default settings
function clearDefaults() {
    if (confirm('Are you sure you want to clear all default settings? This action cannot be undone.')) {
        defaultSettings = {};
        localStorage.removeItem('sltb-defaults');
        
        // Clear the form
        const form = document.getElementById('defaults-form');
        if (form) {
            form.reset();
        }
        
        const statusDiv = document.getElementById('defaults-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="message info">All default settings have been cleared.</div>';
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 3000);
        }
        
        showMessage('Default settings cleared!', 'info');
    }
}

// Preview default settings
function loadDefaultsPreview() {
    const form = document.getElementById('defaults-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const previewData = {};
    
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') {
            previewData[key] = value.trim();
        }
    }
    
    const statusDiv = document.getElementById('defaults-status');
    if (statusDiv) {
        let previewHTML = '<div class="message info"><h4>Current Default Settings Preview:</h4><ul>';
        
        if (Object.keys(previewData).length === 0) {
            previewHTML += '<li>No default values set</li>';
        } else {
            Object.keys(previewData).forEach(key => {
                const friendlyName = getFriendlyFieldName(key);
                previewHTML += `<li><strong>${friendlyName}:</strong> ${previewData[key]}</li>`;
            });
        }
        
        previewHTML += '</ul></div>';
        statusDiv.innerHTML = previewHTML;
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 10000);
    }
}

// Helper function to convert field names to friendly names
function getFriendlyFieldName(fieldName) {
    const fieldMap = {
        'sltbSection': 'SLTB Section',
        'fileReference': 'File Reference',
        'preparedBy': 'Prepared By',
        'checkedBy': 'Checked By',
        'recommendedByFirst': 'Recommended By (First)',
        'recommendedBySecond': 'Recommended By (Second)',
        'paymentApprovedBy': 'Payment Approved By',
        'voucherCertifiedBy': 'Voucher Certified By',
        'ssclVat': 'SSCL VAT (%)',
        'vat': 'VAT (%)'
    };
    
    return fieldMap[fieldName] || fieldName;
}

// Load voucher form
function loadVoucherForm(type) {
    currentVoucherType = type;
    const mainContent = document.getElementById('main-content');
    
    // Hide all pages
    const pages = mainContent.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Update navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    if (type === 'welcome') {
        document.getElementById('welcome-page').classList.add('active');
        return;
    }
    
    if (type === 'defaults') {
        document.getElementById('defaults-page').classList.add('active');
        loadAndPopulateDefaults();
        return;
    }
    
    // Load specific voucher form
    loadSpecificVoucherForm(type);
}

// Load specific voucher form
function loadSpecificVoucherForm(type) {
    const mainContent = document.getElementById('main-content');
    
    // Remove existing voucher forms
    const existingForms = mainContent.querySelectorAll('.voucher-form');
    existingForms.forEach(form => form.remove());
    
    let formHTML = '';
    
    switch (type) {
        case 'payment':
            formHTML = generatePaymentVoucherForm();
            break;
        case 'advance-payment':
            formHTML = generateAdvancePaymentVoucherForm();
            break;
        case 'advance-settlement':
            formHTML = generateAdvanceSettlementVoucherForm();
            break;
        case 'petty-cash':
            formHTML = generatePettyCashVoucherForm();
            break;
    }
    
    mainContent.innerHTML += formHTML;
    
    // Initialize form with defaults automatically
    setTimeout(() => {
        // Ensure defaults are loaded first
        loadDefaults();
        console.log('Auto-filling form with defaults on load...');
        populateFormDefaultsSimplified(); // Use the better simplified function
        // Add expenditure row for all voucher types since all now have the same table structure
        if (type === 'P' || type === 'AP' || type === 'ASP' || type === 'PC') {
            addExpenditureRow();
            // Initialize calculations to show 0.00 values
            calculateTotal();
            // Setup real-time calculation for tax inputs
            setupTaxCalculationEvents();
        }
    }, 100);
}

// Generate Payment Voucher Form
function generatePaymentVoucherForm() {
    return `
    <div class="page active voucher-form" id="payment-voucher-form">
        <div class="form-header">
            <button class="back-btn" onclick="loadVoucherForm('welcome')" title="Back to Home">← Back</button>
            <h2>Payment Voucher</h2>
        </div>
        
        <form id="voucher-form" class="form-container">
            <div class="form-row">
                <div class="form-group">
                    <label for="voucher-no">Voucher No:</label>
                    <input type="text" id="voucher-no" name="voucherNo" readonly>
                </div>
                <div class="form-group">
                    <label for="voucher-date">Date:</label>
                    <input type="date" id="voucher-date" name="voucherDate" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="sltb-section">SLTB Section:</label>
                    <select id="sltb-section" name="sltbSection" required>
                        <option value="">Select Section</option>
                        <option value="Admin">Admin</option>
                        <option value="IT Section">IT Section</option>
                        <option value="Export">Export</option>
                        <option value="TC">TC</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Finance">Finance</option>
                        <option value="Tea Testing Unit">Tea Testing Unit</option>
                        <option value="Audit">Audit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="file-reference">File Reference:</label>
                    <input type="text" id="file-reference" name="fileReference">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="payable-to">Payable To:</label>
                    <input type="text" id="payable-to" name="payableTo" required>
                </div>
                <div class="form-group">
                    <label for="expenditure-code">Expenditure Code:</label>
                    <input type="text" id="expenditure-code" name="expenditureCode">
                </div>
            </div>
        </form>
        
        <div class="expenditure-section">
            <h3>Expenditure Details</h3>
            <table class="expenditure-table" id="expenditure-table">
                <thead>
                    <tr>
                        <th style="width: 40%">Detailed description of service rendered, work executed or goods supplied</th>
                        <th style="width: 15%">Rate Rs.</th>
                        <th style="width: 15%">Units or Months</th>
                        <th style="width: 20%">Amount Rs</th>
                        <th style="width: 10%">Action</th>
                    </tr>
                </thead>
                <tbody id="expenditure-tbody">
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal Rs.</strong></td>
                        <td><strong id="subtotal">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>SSCL VAT (%)</strong></td>
                        <td><input type="number" id="sscl-vat" name="ssclVat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="sscl-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>VAT (%)</strong></td>
                        <td><input type="number" id="vat" name="vat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="vat-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" class="text-right"><strong>Total Payment Rs.</strong></td>
                        <td><strong id="total-payment">0.00</strong></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <button type="button" class="btn btn-success" onclick="addExpenditureRow()">Add Row</button>
        </div>
        
        <div class="approval-section">
            <div class="approval-group">
                <h4>Prepared by</h4>
                <div class="form-group">
                    <input type="text" name="preparedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Checked By</h4>
                <div class="form-group">
                    <input type="text" name="checkedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (First)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedByFirst" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (Second)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedBySecond" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Payment Approved By (FR 137 Approval)</h4>
                <div class="form-group">
                    <input type="text" name="paymentApprovedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Voucher Certified By (FR 138 Voucher Certification)</h4>
                <div class="form-group">
                    <input type="text" name="voucherCertifiedBy" placeholder="Name">
                </div>
            </div>
        </div>
        
        <div class="documents-section">
            <h3>Attached Documents</h3>
            <div class="documents-grid">
                <div class="document-group">
                    <h4>Attached the Copies of following Documents</h4>
                    <ul class="document-checklist">
                        <li><input type="checkbox" name="doc-invoice" id="doc-invoice"><label for="doc-invoice">Invoice</label></li>
                        <li><input type="checkbox" name="doc-board-approval" id="doc-board-approval"><label for="doc-board-approval">Board Approval</label></li>
                        <li><input type="checkbox" name="doc-fr136" id="doc-fr136"><label for="doc-fr136">FR 136 Approval</label></li>
                        <li><input type="checkbox" name="doc-procurement" id="doc-procurement"><label for="doc-procurement">DG/Adm/Procument Approval</label></li>
                        <li><input type="checkbox" name="doc-grn" id="doc-grn"><label for="doc-grn">Good Received Note (GRN)</label></li>
                        <li><input type="checkbox" name="doc-acceptance" id="doc-acceptance"><label for="doc-acceptance">Good Acceptance Committee Report</label></li>
                        <li><input type="checkbox" name="doc-service" id="doc-service"><label for="doc-service">Service Completed Report</label></li>
                    </ul>
                </div>
                
                <div class="document-group">
                    <h4>Other Documents Attached</h4>
                    <div class="form-group">
                        <textarea name="otherDocuments" placeholder="List other related documents..." rows="6"></textarea>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button type="button" class="btn btn-secondary" onclick="loadDefaultsToForm()">Load Defaults</button>
            <button type="button" class="btn btn-primary" onclick="generateVoucherNumber()">Generate Voucher Number</button>
            <button type="button" class="btn btn-success" onclick="saveVoucher()">Save Voucher</button>
            <button type="button" class="btn btn-warning" onclick="loadVoucherData()">Load Voucher</button>
            <button type="button" class="btn btn-primary" onclick="generatePDF()">Generate PDF</button>
            <button type="button" class="btn btn-info" onclick="printVoucher()">Print</button>
        </div>
    </div>`;
}

// Generate Advance Payment Voucher Form
function generateAdvancePaymentVoucherForm() {
    return `
    <div class="page active voucher-form" id="advance-payment-voucher-form">
        <div class="form-header">
            <button class="back-btn" onclick="loadVoucherForm('welcome')" title="Back to Home">← Back</button>
            <h2>Advance Payment Voucher</h2>
        </div>
        
        <form id="voucher-form" class="form-container">
            <div class="form-row">
                <div class="form-group">
                    <label for="voucher-no">Voucher No:</label>
                    <input type="text" id="voucher-no" name="voucherNo" readonly>
                </div>
                <div class="form-group">
                    <label for="voucher-date">Date:</label>
                    <input type="date" id="voucher-date" name="voucherDate" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="sltb-section">SLTB Section:</label>
                    <select id="sltb-section" name="sltbSection" required>
                        <option value="">Select Section</option>
                        <option value="Admin">Admin</option>
                        <option value="IT Section">IT Section</option>
                        <option value="Export">Export</option>
                        <option value="TC">TC</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Finance">Finance</option>
                        <option value="Tea Testing Unit">Tea Testing Unit</option>
                        <option value="Audit">Audit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="file-reference">File Reference:</label>
                    <input type="text" id="file-reference" name="fileReference">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="payable-to">Payable To:</label>
                    <input type="text" id="payable-to" name="payableTo" required>
                </div>
                <div class="form-group">
                    <label for="expenditure-code">Expenditure Code:</label>
                    <input type="text" id="expenditure-code" name="expenditureCode">
                </div>
            </div>
        </form>
        
        <div class="expenditure-section">
            <h3>Expenditure Details</h3>
            <table class="expenditure-table" id="expenditure-table">
                <thead>
                    <tr>
                        <th style="width: 40%">Detailed description of service rendered, work executed or goods supplied</th>
                        <th style="width: 15%">Rate Rs.</th>
                        <th style="width: 15%">Units or Months</th>
                        <th style="width: 20%">Amount Rs</th>
                        <th style="width: 10%">Action</th>
                    </tr>
                </thead>
                <tbody id="expenditure-tbody">
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal Rs.</strong></td>
                        <td><strong id="subtotal">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>SSCL VAT (%)</strong></td>
                        <td><input type="number" id="sscl-vat" name="ssclVat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="sscl-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>VAT (%)</strong></td>
                        <td><input type="number" id="vat" name="vat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="vat-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" class="text-right"><strong>Total Payment Rs.</strong></td>
                        <td><strong id="total-payment">0.00</strong></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <button type="button" class="btn btn-success" onclick="addExpenditureRow()">Add Row</button>
        </div>
        
        <div class="approval-section">
            <div class="approval-group">
                <h4>Prepared by</h4>
                <div class="form-group">
                    <input type="text" name="preparedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Checked By</h4>
                <div class="form-group">
                    <input type="text" name="checkedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (First)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedByFirst" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (Second)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedBySecond" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Payment Approved By (FR 137 Approval)</h4>
                <div class="form-group">
                    <input type="text" name="paymentApprovedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Voucher Certified By (FR 138 Voucher Certification)</h4>
                <div class="form-group">
                    <input type="text" name="voucherCertifiedBy" placeholder="Name">
                </div>
            </div>
        </div>
        
        <div class="documents-section">
            <h3>Attached Documents</h3>
            <div class="documents-grid">
                <div class="document-group">
                    <h4>Attached the Copies of following Documents</h4>
                    <ul class="document-checklist">
                        <li><input type="checkbox" name="doc-invoice" id="doc-invoice"><label for="doc-invoice">Invoice</label></li>
                        <li><input type="checkbox" name="doc-board-approval" id="doc-board-approval"><label for="doc-board-approval">Board Approval</label></li>
                        <li><input type="checkbox" name="doc-fr136" id="doc-fr136"><label for="doc-fr136">FR 136 Approval</label></li>
                        <li><input type="checkbox" name="doc-procurement" id="doc-procurement"><label for="doc-procurement">DG/Adm/Procument Approval</label></li>
                        <li><input type="checkbox" name="doc-grn" id="doc-grn"><label for="doc-grn">Good Received Note (GRN)</label></li>
                        <li><input type="checkbox" name="doc-acceptance" id="doc-acceptance"><label for="doc-acceptance">Good Acceptance Committee Report</label></li>
                        <li><input type="checkbox" name="doc-service" id="doc-service"><label for="doc-service">Service Completed Report</label></li>
                    </ul>
                </div>
                
                <div class="document-group">
                    <h4>Other Documents Attached</h4>
                    <div class="form-group">
                        <textarea name="otherDocuments" placeholder="List other related documents..." rows="6"></textarea>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button type="button" class="btn btn-secondary" onclick="loadDefaultsToForm()">Load Defaults</button>
            <button type="button" class="btn btn-primary" onclick="generateVoucherNumber()">Generate Voucher Number</button>
            <button type="button" class="btn btn-success" onclick="saveVoucher()">Save Voucher</button>
            <button type="button" class="btn btn-warning" onclick="loadVoucherData()">Load Voucher</button>
            <button type="button" class="btn btn-primary" onclick="generatePDF()">Generate PDF</button>
            <button type="button" class="btn btn-info" onclick="printVoucher()">Print</button>
        </div>
    </div>`;
}

// Generate Advance Settlement Voucher Form
function generateAdvanceSettlementVoucherForm() {
    return `
    <div class="page active voucher-form" id="advance-settlement-voucher-form">
        <div class="form-header">
            <button class="back-btn" onclick="loadVoucherForm('welcome')" title="Back to Home">← Back</button>
            <h2>Advance Payment Settlement Voucher</h2>
        </div>
        
        <form id="voucher-form" class="form-container">
            <div class="form-row">
                <div class="form-group">
                    <label for="voucher-no">Voucher No:</label>
                    <input type="text" id="voucher-no" name="voucherNo" readonly>
                </div>
                <div class="form-group">
                    <label for="voucher-date">Date:</label>
                    <input type="date" id="voucher-date" name="voucherDate" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="sltb-section">SLTB Section:</label>
                    <select id="sltb-section" name="sltbSection" required>
                        <option value="">Select Section</option>
                        <option value="Admin">Admin</option>
                        <option value="IT Section">IT Section</option>
                        <option value="Export">Export</option>
                        <option value="TC">TC</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Finance">Finance</option>
                        <option value="Tea Testing Unit">Tea Testing Unit</option>
                        <option value="Audit">Audit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="file-reference">File Reference:</label>
                    <input type="text" id="file-reference" name="fileReference">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="payable-to">Payable To:</label>
                    <input type="text" id="payable-to" name="payableTo" required>
                </div>
                <div class="form-group">
                    <label for="expenditure-code">Expenditure Code:</label>
                    <input type="text" id="expenditure-code" name="expenditureCode">
                </div>
            </div>
        </form>
        
        <div class="expenditure-section">
            <h3>Expenditure Details</h3>
            <table class="expenditure-table" id="expenditure-table">
                <thead>
                    <tr>
                        <th style="width: 40%">Detailed description of service rendered, work executed or goods supplied</th>
                        <th style="width: 15%">Rate Rs.</th>
                        <th style="width: 15%">Units or Months</th>
                        <th style="width: 20%">Amount Rs</th>
                        <th style="width: 10%">Action</th>
                    </tr>
                </thead>
                <tbody id="expenditure-tbody">
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal Rs.</strong></td>
                        <td><strong id="subtotal">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>SSCL VAT (%)</strong></td>
                        <td><input type="number" id="sscl-vat" name="ssclVat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="sscl-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>VAT (%)</strong></td>
                        <td><input type="number" id="vat" name="vat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="vat-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" class="text-right"><strong>Total Payment Rs.</strong></td>
                        <td><strong id="total-payment">0.00</strong></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <button type="button" class="btn btn-success" onclick="addExpenditureRow()">Add Row</button>
        </div>
        
        <div class="approval-section">
            <div class="approval-group">
                <h4>Prepared by</h4>
                <div class="form-group">
                    <input type="text" name="preparedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Checked By</h4>
                <div class="form-group">
                    <input type="text" name="checkedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (First)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedByFirst" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (Second)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedBySecond" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Payment Approved By (FR 137 Approval)</h4>
                <div class="form-group">
                    <input type="text" name="paymentApprovedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Voucher Certified By (FR 138 Voucher Certification)</h4>
                <div class="form-group">
                    <input type="text" name="voucherCertifiedBy" placeholder="Name">
                </div>
            </div>
        </div>
        
        <div class="documents-section">
            <h3>Attached Documents</h3>
            <div class="documents-grid">
                <div class="document-group">
                    <h4>Attached the Copies of following Documents</h4>
                    <ul class="document-checklist">
                        <li><input type="checkbox" name="doc-invoice" id="doc-invoice"><label for="doc-invoice">Invoice</label></li>
                        <li><input type="checkbox" name="doc-board-approval" id="doc-board-approval"><label for="doc-board-approval">Board Approval</label></li>
                        <li><input type="checkbox" name="doc-fr136" id="doc-fr136"><label for="doc-fr136">FR 136 Approval</label></li>
                        <li><input type="checkbox" name="doc-procurement" id="doc-procurement"><label for="doc-procurement">DG/Adm/Procument Approval</label></li>
                        <li><input type="checkbox" name="doc-grn" id="doc-grn"><label for="doc-grn">Good Received Note (GRN)</label></li>
                        <li><input type="checkbox" name="doc-acceptance" id="doc-acceptance"><label for="doc-acceptance">Good Acceptance Committee Report</label></li>
                        <li><input type="checkbox" name="doc-service" id="doc-service"><label for="doc-service">Service Completed Report</label></li>
                    </ul>
                </div>
                
                <div class="document-group">
                    <h4>Other Documents Attached</h4>
                    <div class="form-group">
                        <textarea name="otherDocuments" placeholder="List other related documents..." rows="6"></textarea>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button type="button" class="btn btn-secondary" onclick="loadDefaultsToForm()">Load Defaults</button>
            <button type="button" class="btn btn-primary" onclick="generateVoucherNumber()">Generate Voucher Number</button>
            <button type="button" class="btn btn-success" onclick="saveVoucher()">Save Voucher</button>
            <button type="button" class="btn btn-warning" onclick="loadVoucherData()">Load Voucher</button>
            <button type="button" class="btn btn-primary" onclick="generatePDF()">Generate PDF</button>
            <button type="button" class="btn btn-info" onclick="printVoucher()">Print</button>
        </div>
    </div>`;
}

// Generate Petty Cash Voucher Form
function generatePettyCashVoucherForm() {
    return `
    <div class="page active voucher-form" id="petty-cash-voucher-form">
        <div class="form-header">
            <button class="back-btn" onclick="loadVoucherForm('welcome')" title="Back to Home">← Back</button>
            <h2>Petty Cash Voucher</h2>
        </div>
        
        <form id="voucher-form" class="form-container">
            <div class="form-row">
                <div class="form-group">
                    <label for="voucher-no">Voucher No:</label>
                    <input type="text" id="voucher-no" name="voucherNo" readonly>
                </div>
                <div class="form-group">
                    <label for="voucher-date">Date:</label>
                    <input type="date" id="voucher-date" name="voucherDate" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="sltb-section">SLTB Section:</label>
                    <select id="sltb-section" name="sltbSection" required>
                        <option value="">Select Section</option>
                        <option value="Admin">Admin</option>
                        <option value="IT Section">IT Section</option>
                        <option value="Export">Export</option>
                        <option value="TC">TC</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Finance">Finance</option>
                        <option value="Tea Testing Unit">Tea Testing Unit</option>
                        <option value="Audit">Audit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="file-reference">File Reference:</label>
                    <input type="text" id="file-reference" name="fileReference">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="payable-to">Payable To:</label>
                    <input type="text" id="payable-to" name="payableTo" required>
                </div>
                <div class="form-group">
                    <label for="expenditure-code">Expenditure Code:</label>
                    <input type="text" id="expenditure-code" name="expenditureCode">
                </div>
            </div>
        </form>
        
        <div class="expenditure-section">
            <h3>Expenditure Details</h3>
            <table class="expenditure-table" id="expenditure-table">
                <thead>
                    <tr>
                        <th style="width: 40%">Detailed description of service rendered, work executed or goods supplied</th>
                        <th style="width: 15%">Rate Rs.</th>
                        <th style="width: 15%">Units or Months</th>
                        <th style="width: 20%">Amount Rs</th>
                        <th style="width: 10%">Action</th>
                    </tr>
                </thead>
                <tbody id="expenditure-tbody">
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal Rs.</strong></td>
                        <td><strong id="subtotal">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>SSCL VAT (%)</strong></td>
                        <td><input type="number" id="sscl-vat" name="ssclVat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="sscl-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right"><strong>VAT (%)</strong></td>
                        <td><input type="number" id="vat" name="vat" step="0.01" placeholder="0" onchange="calculateTotal()"></td>
                        <td><strong id="vat-amount">0.00</strong></td>
                        <td></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" class="text-right"><strong>Total Payment Rs.</strong></td>
                        <td><strong id="total-payment">0.00</strong></td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            <button type="button" class="btn btn-success" onclick="addExpenditureRow()">Add Row</button>
        </div>
        
        <div class="approval-section">
            <div class="approval-group">
                <h4>Prepared by</h4>
                <div class="form-group">
                    <input type="text" name="preparedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Checked By</h4>
                <div class="form-group">
                    <input type="text" name="checkedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (First)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedByFirst" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Recommended by (Second)</h4>
                <div class="form-group">
                    <input type="text" name="recommendedBySecond" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Payment Approved By (FR 137 Approval)</h4>
                <div class="form-group">
                    <input type="text" name="paymentApprovedBy" placeholder="Name">
                </div>
            </div>
            
            <div class="approval-group">
                <h4>Voucher Certified By (FR 138 Voucher Certification)</h4>
                <div class="form-group">
                    <input type="text" name="voucherCertifiedBy" placeholder="Name">
                </div>
            </div>
        </div>
        
        <div class="documents-section">
            <h3>Attached Documents</h3>
            <div class="documents-grid">
                <div class="document-group">
                    <h4>Attached the Copies of following Documents</h4>
                    <ul class="document-checklist">
                        <li><input type="checkbox" name="doc-invoice" id="doc-invoice"><label for="doc-invoice">Invoice</label></li>
                        <li><input type="checkbox" name="doc-board-approval" id="doc-board-approval"><label for="doc-board-approval">Board Approval</label></li>
                        <li><input type="checkbox" name="doc-fr136" id="doc-fr136"><label for="doc-fr136">FR 136 Approval</label></li>
                        <li><input type="checkbox" name="doc-procurement" id="doc-procurement"><label for="doc-procurement">DG/Adm/Procument Approval</label></li>
                        <li><input type="checkbox" name="doc-grn" id="doc-grn"><label for="doc-grn">Good Received Note (GRN)</label></li>
                        <li><input type="checkbox" name="doc-acceptance" id="doc-acceptance"><label for="doc-acceptance">Good Acceptance Committee Report</label></li>
                        <li><input type="checkbox" name="doc-service" id="doc-service"><label for="doc-service">Service Completed Report</label></li>
                    </ul>
                </div>
                
                <div class="document-group">
                    <h4>Other Documents Attached</h4>
                    <div class="form-group">
                        <textarea name="otherDocuments" placeholder="List other related documents..." rows="6"></textarea>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="button-group">
            <button type="button" class="btn btn-secondary" onclick="loadDefaultsToForm()">Load Defaults</button>
            <button type="button" class="btn btn-primary" onclick="generateVoucherNumber()">Generate Voucher Number</button>
            <button type="button" class="btn btn-success" onclick="saveVoucher()">Save Voucher</button>
            <button type="button" class="btn btn-warning" onclick="loadVoucherData()">Load Voucher</button>
            <button type="button" class="btn btn-primary" onclick="generatePDF()">Generate PDF</button>
            <button type="button" class="btn btn-info" onclick="printVoucher()">Print</button>
        </div>
    </div>`;
}

// Populate form with default values
function populateFormDefaults() {
    console.log('Populating form with defaults:', defaultSettings);
    
    if (!defaultSettings || Object.keys(defaultSettings).length === 0) {
        console.log('No default settings found');
        // Set today's date anyway
        const dateInput = document.getElementById('voucher-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        return;
    }
    
    Object.keys(defaultSettings).forEach(key => {
        const value = defaultSettings[key];
        if (!value || value.trim() === '') return;
        
        // Multiple strategies to find the element
        let element = null;
        
        // Strategy 1: Find by name attribute
        element = document.querySelector(`[name="${key}"]`);
        
        // Strategy 2: Find by exact ID
        if (!element) {
            element = document.getElementById(key);
        }
        
        // Strategy 3: Find by mapped ID (for form fields with different naming)
        if (!element) {
            const fieldMappings = {
                'sltbSection': 'sltb-section',
                'fileReference': 'file-reference',
                'preparedBy': 'preparedBy',
                'checkedBy': 'checkedBy', 
                'recommendedByFirst': 'recommendedByFirst',
                'recommendedBySecond': 'recommendedBySecond',
                'paymentApprovedBy': 'paymentApprovedBy',
                'voucherCertifiedBy': 'voucherCertifiedBy',
                'ssclVat': 'sscl-vat',
                'vat': 'vat'
            };
            
            const mappedId = fieldMappings[key];
            if (mappedId) {
                element = document.getElementById(mappedId);
            }
        }
        
        // Strategy 4: Find inputs with specific names that contain the key
        if (!element) {
            const possibleSelectors = [
                `input[name*="${key}"]`,
                `select[name*="${key}"]`,
                `textarea[name*="${key}"]`,
                `input[id*="${key}"]`,
                `select[id*="${key}"]`,
                `textarea[id*="${key}"]`
            ];
            
            for (const selector of possibleSelectors) {
                element = document.querySelector(selector);
                if (element) break;
            }
        }
        
        if (element) {
            console.log(`Setting ${key} to ${value} on element:`, element);
            
            // Handle different input types
            if (element.tagName === 'SELECT') {
                // For select elements, check if option exists
                const option = element.querySelector(`option[value="${value}"]`);
                if (option) {
                    element.value = value;
                    console.log(`Set select ${key} to ${value}`);
                } else {
                    console.warn(`Option not found for ${key}: ${value}`);
                }
            } else if (element.type === 'checkbox') {
                // For checkboxes, set checked property
                element.checked = value === 'true' || value === true;
            } else {
                // For text inputs, textareas, etc.
                element.value = value;
                console.log(`Set input ${key} to ${value}`);
            }
        } else {
            console.warn(`Element not found for key: ${key}`);
        }
    });
    
    // Always set today's date if date field exists and is empty
    const dateInput = document.getElementById('voucher-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
        console.log('Set date to today');
    }
}

// Add expenditure row (for payment voucher)
function addExpenditureRow() {
    const tbody = document.getElementById('expenditure-tbody');
    if (!tbody) return;
    
    expenditureCount++;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><textarea name="expenditure-desc-${expenditureCount}" placeholder="Description of service rendered, work executed or goods supplied..." rows="2"></textarea></td>
        <td><input type="number" name="expenditure-rate-${expenditureCount}" step="0.01" class="rate-input" placeholder="0.00" onchange="calculateRowTotal(${expenditureCount})" oninput="calculateRowTotal(${expenditureCount})"></td>
        <td><input type="number" name="expenditure-units-${expenditureCount}" step="0.01" class="units-input" placeholder="1" onchange="calculateRowTotal(${expenditureCount})" oninput="calculateRowTotal(${expenditureCount})"></td>
        <td><input type="number" name="expenditure-amount-${expenditureCount}" step="0.01" class="amount-input" placeholder="0.00" readonly></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="removeExpenditureRow(this)">Remove</button></td>
    `;
    tbody.appendChild(row);
}

// Remove expenditure row
function removeExpenditureRow(button) {
    const row = button.closest('tr');
    row.remove();
    calculateTotal();
}

// Calculate row total
function calculateRowTotal(rowNumber) {
    const rateInput = document.querySelector(`[name="expenditure-rate-${rowNumber}"]`);
    const unitsInput = document.querySelector(`[name="expenditure-units-${rowNumber}"]`);
    const amountInput = document.querySelector(`[name="expenditure-amount-${rowNumber}"]`);
    
    if (rateInput && unitsInput && amountInput) {
        const rate = parseFloat(rateInput.value) || 0;
        const units = parseFloat(unitsInput.value) || 0;
        const amount = rate * units;
        amountInput.value = amount.toFixed(2);
        calculateTotal();
    }
}

// Calculate total payment
function calculateTotal() {
    let subtotal = 0;
    
    // Sum all expenditure amounts
    const amountInputs = document.querySelectorAll('.amount-input');
    console.log(`Found ${amountInputs.length} amount inputs`);
    
    amountInputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        subtotal += value;
        console.log(`Amount input value: ${value}, running subtotal: ${subtotal}`);
    });
    
    // Update subtotal display
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = subtotal.toFixed(2);
        console.log(`Updated subtotal display to: ${subtotal.toFixed(2)}`);
    } else {
        console.log('Subtotal element not found!');
    }
    
    // Calculate taxes
    const ssclVat = parseFloat(document.getElementById('sscl-vat')?.value) || 0;
    const vat = parseFloat(document.getElementById('vat')?.value) || 0;
    
    const ssclAmount = (subtotal * ssclVat) / 100;
    const vatAmount = (subtotal * vat) / 100;
    
    // Update tax amounts display
    const ssclAmountElement = document.getElementById('sscl-amount');
    const vatAmountElement = document.getElementById('vat-amount');
    
    if (ssclAmountElement) {
        ssclAmountElement.textContent = ssclAmount.toFixed(2);
    }
    if (vatAmountElement) {
        vatAmountElement.textContent = vatAmount.toFixed(2);
    }
    
    // Calculate and display total
    const total = subtotal + ssclAmount + vatAmount;
    
    const totalElement = document.getElementById('total-payment');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
    }
    
    console.log(`Calculation: Subtotal: ${subtotal.toFixed(2)}, SSCL VAT (${ssclVat}%): ${ssclAmount.toFixed(2)}, VAT (${vat}%): ${vatAmount.toFixed(2)}, Total: ${total.toFixed(2)}`);
}

// Setup real-time calculation events for tax inputs
function setupTaxCalculationEvents() {
    const ssclVatInput = document.getElementById('sscl-vat');
    const vatInput = document.getElementById('vat');
    
    if (ssclVatInput) {
        ssclVatInput.addEventListener('input', calculateTotal);
        ssclVatInput.addEventListener('change', calculateTotal);
    }
    
    if (vatInput) {
        vatInput.addEventListener('input', calculateTotal);
        vatInput.addEventListener('change', calculateTotal);
    }
}

// Calculate advance payment total
function calculateAdvanceTotal() {
    const rate = parseFloat(document.getElementById('rate')?.value) || 0;
    const units = parseFloat(document.getElementById('units')?.value) || 1;
    const amount = rate * units;
    
    const amountInput = document.getElementById('amount');
    const totalInput = document.getElementById('total-payment');
    
    if (amountInput) amountInput.value = amount.toFixed(2);
    if (totalInput) totalInput.value = amount.toFixed(2);
}

// Calculate petty cash total
function calculatePettyCashTotal() {
    calculateAdvanceTotal(); // Same calculation
}

// Calculate settlement balance
function calculateSettlement() {
    const advance = parseFloat(document.getElementById('amount-advance')?.value) || 0;
    const spent = parseFloat(document.getElementById('amount-spent')?.value) || 0;
    const balance = advance - spent;
    
    const balanceInput = document.getElementById('balance-due');
    if (balanceInput) {
        balanceInput.value = balance.toFixed(2);
    }
}

// Generate voucher number - Short format
function generateVoucherNumber() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Generate a random 3-digit number for uniqueness
    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    
    // Short voucher type codes
    const typeCode = {
        'payment': 'PV',
        'advance-payment': 'AP', 
        'advance-settlement': 'AS',
        'petty-cash': 'PC'
    };
    
    const code = typeCode[currentVoucherType] || 'VR';
    const voucherNumber = `${code}${year}${month}${day}${randomNum}`;
    
    const voucherNoInput = document.getElementById('voucher-no');
    if (voucherNoInput) {
        voucherNoInput.value = voucherNumber;
    }
    
    showMessage('Short voucher number generated successfully!', 'success');
}

// Save voucher data
async function saveVoucher() {
    const formData = collectFormData();
    
    try {
        const result = await ipcRenderer.invoke('save-voucher-data', formData);
        if (result.success) {
            showMessage(`Voucher saved successfully! Saved to: ${result.path}`, 'success');
        } else {
            showMessage(`Error saving voucher: ${result.error}`, 'error');
        }
    } catch (error) {
        showMessage(`Error saving voucher: ${error.message}`, 'error');
    }
}

// Load voucher data
async function loadVoucherData() {
    try {
        const result = await ipcRenderer.invoke('load-voucher-data');
        if (result.success) {
            populateFormWithData(result.data);
            showMessage('Voucher loaded successfully!', 'success');
        } else {
            showMessage(`Error loading voucher: ${result.error}`, 'error');
        }
    } catch (error) {
        showMessage(`Error loading voucher: ${error.message}`, 'error');
    }
}

// Collect form data
function collectFormData() {
    const form = document.getElementById('voucher-form');
    const formData = new FormData(form);
    
    const data = {
        type: currentVoucherType,
        timestamp: new Date().toISOString(),
        formData: {}
    };
    
    // Collect basic form data with effective values (manual or default)
    for (let [key, value] of formData.entries()) {
        data.formData[key] = value;
    }
    
    // Use effective values for key fields (manual data priority, defaults as fallback)
    const keyFields = ['fileReference', 'sltbSection', 'payableTo', 'expenditureCode'];
    keyFields.forEach(fieldName => {
        // Only use effective value if the field is empty or not collected yet
        if (!data.formData[fieldName] || data.formData[fieldName].trim() === '') {
            const effectiveValue = getEffectiveValueByField(fieldName);
            if (effectiveValue && effectiveValue.trim()) {
                data.formData[fieldName] = effectiveValue;
            }
        }
    });
    
    // Collect approval data using effective values (manual data priority, defaults as fallback)
    const approvalFields = [
        'preparedBy', 'checkedBy', 'recommendedByFirst', 'recommendedBySecond',
        'paymentApprovedBy', 'voucherCertifiedBy'
    ];
    
    approvalFields.forEach(fieldName => {
        // Only use effective value if not already collected or empty
        if (!data.formData[fieldName] || data.formData[fieldName].trim() === '') {
            const effectiveValue = getEffectiveValueByField(fieldName);
            if (effectiveValue && effectiveValue.trim()) {
                data.formData[fieldName] = effectiveValue;
            }
        }
    });
    
    // Collect other documents textarea with effective value (manual priority)
    const otherDocs = document.querySelector('[name="otherDocuments"]');
    if (otherDocs) {
        // Only use effective value if field is empty or not collected yet
        if (!data.formData.otherDocuments || data.formData.otherDocuments.trim() === '') {
            const effectiveValue = getEffectiveValue(otherDocs);
            if (effectiveValue && effectiveValue.trim()) {
                data.formData.otherDocuments = effectiveValue;
            }
        }
    }
    
    // Collect expenditure data for all voucher types (all now have expenditure tables)
    data.expenditures = [];
    
    // More robust collection: scan all existing expenditure rows
    const expenditureRows = document.querySelectorAll('#expenditure-tbody tr');
    console.log('Data Collection - expenditureCount:', expenditureCount);
    console.log('Data Collection - actual rows found:', expenditureRows.length);
    
    expenditureRows.forEach((row, index) => {
        const desc = row.querySelector('textarea[name*="expenditure-desc"]')?.value;
        const rate = row.querySelector('input[name*="expenditure-rate"]')?.value;
        const units = row.querySelector('input[name*="expenditure-units"]')?.value;
        const amount = row.querySelector('input[name*="expenditure-amount"]')?.value;
        
        console.log(`Row ${index + 1}:`, { desc, rate, units, amount });
        
        if (desc || rate || units || amount) {
            data.expenditures.push({ desc, rate, units, amount });
        }
    });
    
    console.log('Data Collection - Total expenditures collected:', data.expenditures.length);
    
    // Collect subtotal and tax information
    const subtotalElement = document.getElementById('subtotal');
    const ssclVatInput = document.getElementById('sscl-vat');
    const vatInput = document.getElementById('vat');
    const ssclAmountElement = document.getElementById('sscl-amount');
    const vatAmountElement = document.getElementById('vat-amount');
    const totalElement = document.getElementById('total-payment');
    
    if (subtotalElement) {
        data.subtotal = subtotalElement.textContent || subtotalElement.value || '0.00';
    }
    if (ssclVatInput) {
        data.ssclVat = ssclVatInput.value || '0';
    }
    if (vatInput) {
        data.vat = vatInput.value || '0';
    }
    if (ssclAmountElement) {
        data.ssclAmount = ssclAmountElement.textContent || '0.00';
    }
    if (vatAmountElement) {
        data.vatAmount = vatAmountElement.textContent || '0.00';
    }
    if (totalElement) {
        data.totalAmount = totalElement.textContent || totalElement.value || '0.00';
    }
    
    // Collect document checkboxes
    data.documents = {};
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        data.documents[checkbox.name] = checkbox.checked;
    });
    
    return data;
}

// Populate form with loaded data
function populateFormWithData(data) {
    // Populate basic form fields
    Object.keys(data.formData).forEach(key => {
        const element = document.querySelector(`[name="${key}"]`);
        if (element) {
            element.value = data.formData[key];
        }
    });
    
    // Populate expenditures for payment vouchers
    if (data.expenditures && currentVoucherType === 'P') {
        // Clear existing rows
        const tbody = document.getElementById('expenditure-tbody');
        if (tbody) tbody.innerHTML = '';
        expenditureCount = 0;
        
        // Add rows for each expenditure
        data.expenditures.forEach((exp, index) => {
            addExpenditureRow();
            const currentCount = expenditureCount;
            
            setTimeout(() => {
                document.querySelector(`[name="expenditure-desc-${currentCount}"]`).value = exp.desc || '';
                document.querySelector(`[name="expenditure-rate-${currentCount}"]`).value = exp.rate || '';
                document.querySelector(`[name="expenditure-units-${currentCount}"]`).value = exp.units || '';
                document.querySelector(`[name="expenditure-amount-${currentCount}"]`).value = exp.amount || '';
            }, 100);
        });
    }
    
    // Populate document checkboxes
    if (data.documents) {
        Object.keys(data.documents).forEach(key => {
            const checkbox = document.querySelector(`[name="${key}"]`);
            if (checkbox) {
                checkbox.checked = data.documents[key];
            }
        });
    }
    
    // Recalculate totals
    setTimeout(() => {
        if (currentVoucherType === 'P') {
            calculateTotal();
        } else if (currentVoucherType === 'AP' || currentVoucherType === 'PC') {
            calculateAdvanceTotal();
        } else if (currentVoucherType === 'ASP') {
            calculateSettlement();
        }
    }, 200);
}

// Generate PDF
function generatePDF() {
    const voucherNumber = document.getElementById('voucher-no')?.value;
    if (!voucherNumber) {
        showMessage('Please generate a voucher number first!', 'error');
        return;
    }
    
    showMessage('Generating PDF...', 'info');
    
    // Import jsPDF dynamically
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        .then(() => {
            const { jsPDF } = window.jspdf;
            generatePDFDocument(jsPDF);
        })
        .catch(error => {
            console.error('Error loading jsPDF:', error);
            showMessage('Error loading PDF library. Please check your internet connection.', 'error');
        });
}

// Helper function to truncate text to fit within specified width
function truncateText(doc, text, maxWidth, fontSize = 11) {
    if (!text) return '';
    
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    
    if (textWidth <= maxWidth) {
        return text;
    }
    
    // Truncate text and add ellipsis
    let truncated = text;
    while (doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
    }
    
    return truncated + (truncated.length < text.length ? '...' : '');
}

// Helper function to wrap text within specified width
function wrapText(doc, text, maxWidth, fontSize = 9) {
    if (!text) return [''];
    
    doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = doc.getTextWidth(testLine);
        
        if (testWidth <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                // Single word is too long, truncate it
                lines.push(truncateText(doc, word, maxWidth, fontSize));
                currentLine = '';
            }
        }
    });
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [''];
}

// Helper function to add logo to PDF
function addLogoToPDF(doc, x, y, size) {
    try {
        // Try to get logo element from HTML header
        const logoImg = document.querySelector('.logo-section img');
        
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            console.log('Found logo image, adding to PDF...');
            
            // Create canvas to convert image to base64
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions
            const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
            canvas.width = 200; // Standard width
            canvas.height = 200 / aspectRatio;
            
            // Draw image to canvas
            ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64 and add to PDF
            const logoDataUrl = canvas.toDataURL('image/png');
            doc.addImage(logoDataUrl, 'PNG', x, y, size, size);
            console.log('Logo successfully added to PDF');
            return true;
        } else {
            console.log('Logo image not found or not loaded');
        }
    } catch (error) {
        console.log('Logo conversion error:', error);
    }
    return false;
}

// Generate PDF document matching SLTB official template - Single Page Optimized
function generatePDFDocument(jsPDF) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const formData = collectFormData();
    
    // Debug: Log collected data to check if approval fields are being collected
    console.log('Collected form data:', formData);
    
    // Define page dimensions - optimized for single page
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10; // Reduced margin for more space
    const usableWidth = pageWidth - 2 * margin;
    
    // Set line width for all borders
    doc.setLineWidth(0.5);
    
    // Logo section (top left) - with actual logo support
    const logoSize = 25;
    
    // Try to add the actual SLTB logo
    const logoAdded = addLogoToPDF(doc, margin, margin, logoSize);
    
    if (!logoAdded) {
        // Fallback: Create professional SLTB logo box
        doc.setLineWidth(1);
        doc.rect(margin, margin, logoSize, logoSize);
        
        // SLTB branding text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('SLTB', margin + logoSize/2, margin + logoSize/2 - 2, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Sri Lanka', margin + logoSize/2, margin + logoSize/2 + 2, { align: 'center' });
        doc.text('Tea Board', margin + logoSize/2, margin + logoSize/2 + 6, { align: 'center' });
    }
    
    // Calculate available space for title (avoiding right-side boxes)
    const headerRight = pageWidth - margin - 70;
    const titleAreaWidth = headerRight - margin - logoSize - 10; // Available width for title
    const titleCenterX = margin + logoSize + 5 + (titleAreaWidth / 2); // Center within available space
    
    // Debug positioning
    console.log('PDF Title Layout:', {
        pageWidth, headerRight, titleAreaWidth, titleCenterX, logoSize
    });
    
    // Title section - positioned to avoid overlap
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16); // Increased from 14
    doc.text('Sri Lanka Tea Board', titleCenterX, margin + 8, { align: 'center' });
    
    // Get voucher title
    let title = '';
    switch (currentVoucherType) {
        case 'payment':
            title = 'Payment Voucher';
            break;
        case 'advance-payment':
            title = 'Advance Payment Voucher';
            break;
        case 'advance-settlement':
            title = 'Advance Payment Settlement Voucher';
            break;
        case 'petty-cash':
            title = 'Petty Cash Voucher';
            break;
    }
    
    // Handle long titles by adjusting font size or splitting text
    doc.setFontSize(14);
    let titleFontSize = 14;
    
    // Check if title is too wide and adjust accordingly
    const titleWidth = doc.getTextWidth(title);
    console.log('Title width check:', { title, titleWidth, titleAreaWidth });
    
    if (titleWidth > titleAreaWidth) {
        // Try smaller font first
        titleFontSize = 12;
        doc.setFontSize(titleFontSize);
        
        // If still too wide, split into multiple lines
        if (doc.getTextWidth(title) > titleAreaWidth) {
            const words = title.split(' ');
            
            // Handle specific long titles with better splits
            if (title === 'Advance Payment Settlement Voucher') {
                doc.text('Advance Payment', titleCenterX, margin + 16, { align: 'center' });
                doc.text('Settlement Voucher', titleCenterX, margin + 22, { align: 'center' });
            } else if (words.length > 2) {
                // Split long titles into two lines
                const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
                const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
                
                doc.text(line1, titleCenterX, margin + 16, { align: 'center' });
                doc.text(line2, titleCenterX, margin + 22, { align: 'center' });
            } else {
                doc.text(title, titleCenterX, margin + 18, { align: 'center' });
            }
        } else {
            doc.text(title, titleCenterX, margin + 18, { align: 'center' });
        }
    } else {
        doc.text(title, titleCenterX, margin + 18, { align: 'center' });
    }
    
    // Voucher No and Date boxes (top right) - using previously calculated headerRight
    const boxWidth = 70;
    const boxHeight = 12; // Reduced height
    
    // Voucher No box
    doc.rect(headerRight, margin, boxWidth, boxHeight);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Voucher No', headerRight + 2, margin + 7);
    doc.setFont('helvetica', 'normal');
    const voucherNoText = truncateText(doc, formData.formData.voucherNo || '', boxWidth - 25, 8);
    doc.text(voucherNoText, headerRight + 32, margin + 7);
    
    // Date box
    doc.rect(headerRight, margin + 12, boxWidth, boxHeight);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', headerRight + 2, margin + 19);
    doc.setFont('helvetica', 'normal');
    const dateText = truncateText(doc, formData.formData.voucherDate || '', boxWidth - 15, 8);
    doc.text(dateText, headerRight + 18, margin + 19);
    
    // Main content area starts - optimized positioning
    let currentY = margin + 30; // Reduced space after header
    
    // First row: SLTB Section | File Reference
    const rowHeight = 10; // Reduced height
    doc.rect(margin, currentY, usableWidth, rowHeight);
    
    const halfWidth = usableWidth / 2;
    doc.line(margin + halfWidth, currentY, margin + halfWidth, currentY + rowHeight);
    
    const labelWidth = 30; // Reduced label width
    doc.line(margin + labelWidth, currentY, margin + labelWidth, currentY + rowHeight);
    doc.line(margin + halfWidth + labelWidth, currentY, margin + halfWidth + labelWidth, currentY + rowHeight);
    
    doc.setFontSize(9); // Increased font size
    doc.setFont('helvetica', 'bold');
    doc.text('SLTB Section', margin + 1, currentY + 6);
    doc.text('File Reference', margin + halfWidth + 1, currentY + 6);
    
    doc.setFont('helvetica', 'normal');
    const sectionText = truncateText(doc, formData.formData.sltbSection || '', halfWidth - labelWidth - 2, 8);
    const fileRefText = truncateText(doc, formData.formData.fileReference || '', halfWidth - labelWidth - 2, 8);
    doc.text(sectionText, margin + labelWidth + 1, currentY + 6);
    doc.text(fileRefText, margin + halfWidth + labelWidth + 1, currentY + 6);
    
    currentY += rowHeight;
    
    // Second row: Payable To
    doc.rect(margin, currentY, usableWidth, rowHeight);
    doc.line(margin + labelWidth, currentY, margin + labelWidth, currentY + rowHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Payable To', margin + 1, currentY + 6);
    
    doc.setFont('helvetica', 'normal');
    const payableText = truncateText(doc, formData.formData.payee || formData.formData.payableTo || '', usableWidth - labelWidth - 2, 8);
    doc.text(payableText, margin + labelWidth + 1, currentY + 6);
    
    currentY += rowHeight;
    
    // Third row: Expenditure Code
    doc.rect(margin, currentY, usableWidth, rowHeight);
    doc.line(margin + 45, currentY, margin + 45, currentY + rowHeight); // Adjusted for "Expenditure Code"
    
    doc.setFont('helvetica', 'bold');
    doc.text('Expenditure Code', margin + 1, currentY + 6);
    
    doc.setFont('helvetica', 'normal');
    const expenditureText = truncateText(doc, formData.formData.expenditureCode || '', usableWidth - 47, 8);
    doc.text(expenditureText, margin + 46, currentY + 6);
    
    currentY += rowHeight + 2; // Minimal spacing
    
    // Expenditure table - dynamic height based on number of items
    const numItems = formData.expenditures ? formData.expenditures.filter(exp => exp.desc && exp.desc.trim()).length : 0;
    const minTableHeight = 65; // Minimum height for subtotal breakdown
    const itemRowHeight = 4; // Height per expenditure row
    const maxTableHeight = 120; // Maximum height before considering page break
    const calculatedHeight = 40 + (numItems * itemRowHeight) + 32; // header + items + subtotal section
    const tableHeight = Math.min(Math.max(minTableHeight, calculatedHeight), maxTableHeight);
    const tableWidth = usableWidth;
    
    console.log('PDF Generation - Table sizing:', { numItems, calculatedHeight, tableHeight });
    
    // Draw main expenditure table border
    doc.rect(margin, currentY, tableWidth, tableHeight);
    
    // Column divisions - optimized proportions
    const col1Width = tableWidth * 0.42;  // Description column
    const col2Width = tableWidth * 0.19;  // Rate column  
    const col3Width = tableWidth * 0.19;  // Units column
    const col4Width = tableWidth * 0.20;  // Amount column
    
    // Draw vertical lines for columns
    doc.line(margin + col1Width, currentY, margin + col1Width, currentY + tableHeight);
    doc.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + tableHeight);
    doc.line(margin + col1Width + col2Width + col3Width, currentY, margin + col1Width + col2Width + col3Width, currentY + tableHeight);
    
    // Header row - reduced height
    const headerHeight = 15; // Reduced from 20
    doc.line(margin, currentY + headerHeight, margin + tableWidth, currentY + headerHeight);
    
    // Header text - compressed
    doc.setFontSize(8); // Increased from 7
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed description of service rendered,', margin + 1, currentY + 4);
    doc.text('work executed or goods supplied and', margin + 1, currentY + 7);
    doc.text('Certificate of Approving officer, where', margin + 1, currentY + 10);
    
    doc.text('Rate Rs.', margin + col1Width + col2Width/2, currentY + 8, { align: 'center' });
    doc.text('Units or', margin + col1Width + col2Width + col3Width/2, currentY + 6, { align: 'center' });
    doc.text('Months', margin + col1Width + col2Width + col3Width/2, currentY + 9, { align: 'center' });
    doc.text('Amount Rs', margin + col1Width + col2Width + col3Width + col4Width/2, currentY + 8, { align: 'center' });
    
    // Content rows - optimized spacing for subtotal breakdown
    if (formData.expenditures && formData.expenditures.length > 0) {
        let rowY = currentY + headerHeight + 3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8); // Increased font size
        
        let itemsDisplayed = 0;
        formData.expenditures.forEach((exp, index) => { // Show ALL expenditure items
            if (exp.desc && exp.desc.trim() && rowY < currentY + tableHeight - 40) {
                const displayDesc = truncateText(doc, exp.desc, col1Width - 4, 7);
                doc.text(displayDesc, margin + 2, rowY);
                
                const rateText = truncateText(doc, exp.rate || '0', col2Width - 4, 7);
                const unitsText = truncateText(doc, exp.units || '0', col3Width - 4, 7);
                const amountText = truncateText(doc, exp.amount || '0', col4Width - 4, 7);
                
                // Right-align numerical values
                doc.text(rateText, margin + col1Width + col2Width - 2, rowY, { align: 'right' });
                doc.text(unitsText, margin + col1Width + col2Width + col3Width - 2, rowY, { align: 'right' });
                doc.text(amountText, margin + col1Width + col2Width + col3Width + col4Width - 2, rowY, { align: 'right' });
                rowY += itemRowHeight; // Use consistent row spacing
                itemsDisplayed++;
            }
        });
        
        console.log('PDF Generation - Items displayed:', itemsDisplayed, 'out of', formData.expenditures.length);
    }
    
    // Subtotal and Tax breakdown rows at bottom
    const subtotalRowY = currentY + tableHeight - 40; // Create space for multiple rows
    
    // Calculate values
    const subtotal = parseFloat(formData.subtotal || '0');
    const ssclVat = parseFloat(formData.ssclVat || '0');
    const vat = parseFloat(formData.vat || '0');
    const ssclAmount = (subtotal * ssclVat) / 100;
    const vatAmount = (subtotal * vat) / 100;
    const totalAmount = subtotal + ssclAmount + vatAmount;
    
    // Debug log
    console.log('PDF Generation - Tax Breakdown:', {
        subtotal, ssclVat, vat, ssclAmount, vatAmount, totalAmount
    });
    console.log('PDF Generation - Column Widths:', {
        col1Width, col2Width, col3Width, col4Width, tableWidth
    });
    console.log('PDF Generation - Expenditure Items:', formData.expenditures);
    console.log('PDF Generation - Number of Items:', numItems, 'Table Height:', tableHeight);
    
    // Calculate exact column positions for proper alignment
    const col1X = margin + 2; // Description column start (with padding)
    const col2X = margin + col1Width + 2; // Rate column start (with padding)
    const col3X = margin + col1Width + col2Width + 2; // Units column start (with padding)
    const col4X = margin + col1Width + col2Width + col3Width + 2; // Amount column start (with padding)
    
    // Calculate right-aligned positions for numbers
    const col2RightX = margin + col1Width + col2Width - 2; // Rate column right align
    const col3RightX = margin + col1Width + col2Width + col3Width - 2; // Units column right align
    const col4RightX = margin + col1Width + col2Width + col3Width + col4Width - 2; // Amount column right align
    
    // Subtotal row
    doc.line(margin, subtotalRowY, margin + tableWidth, subtotalRowY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Subtotal Rs.', col1X + col1Width + col2Width - 30, subtotalRowY + 6);
    doc.text(subtotal.toFixed(2), col4RightX, subtotalRowY + 6, { align: 'right' });
    
    // SSCL VAT row
    const ssclRowY = subtotalRowY + 8;
    doc.line(margin, ssclRowY, margin + tableWidth, ssclRowY);
    // Draw vertical lines for SSCL VAT row
    doc.line(margin + col1Width, ssclRowY, margin + col1Width, ssclRowY + 8);
    doc.line(margin + col1Width + col2Width, ssclRowY, margin + col1Width + col2Width, ssclRowY + 8);
    doc.line(margin + col1Width + col2Width + col3Width, ssclRowY, margin + col1Width + col2Width + col3Width, ssclRowY + 8);
    
    doc.text('SSCL VAT (%)', col1X, ssclRowY + 6);
    doc.text(ssclVat.toFixed(2), col3RightX, ssclRowY + 6, { align: 'right' });
    doc.text(ssclAmount.toFixed(2), col4RightX, ssclRowY + 6, { align: 'right' });
    
    // VAT row
    const vatRowY = ssclRowY + 8;
    doc.line(margin, vatRowY, margin + tableWidth, vatRowY);
    // Draw vertical lines for VAT row
    doc.line(margin + col1Width, vatRowY, margin + col1Width, vatRowY + 8);
    doc.line(margin + col1Width + col2Width, vatRowY, margin + col1Width + col2Width, vatRowY + 8);
    doc.line(margin + col1Width + col2Width + col3Width, vatRowY, margin + col1Width + col2Width + col3Width, vatRowY + 8);
    
    doc.setFontSize(8);
    doc.text('VAT (%)', col1X, vatRowY + 6);
    doc.text(vat.toFixed(2), col3RightX, vatRowY + 6, { align: 'right' });
    doc.text(vatAmount.toFixed(2), col4RightX, vatRowY + 6, { align: 'right' });
    
    // Total Payment row
    const totalRowY = vatRowY + 8;
    doc.line(margin, totalRowY, margin + tableWidth, totalRowY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Total Payment Rs.', col1X + col1Width + col2Width - 30, totalRowY + 6);
    doc.text(totalAmount.toFixed(2), col4RightX, totalRowY + 6, { align: 'right' });
    
    currentY += tableHeight + 5; // Reduced spacing
    
    // Approval section - compact 2x2 grid
    const approvalWidth = usableWidth / 2;
    const approvalHeight = 18; // Reduced from 25
    
    // Top row: Prepared by | Checked By
    doc.rect(margin, currentY, approvalWidth, approvalHeight);
    doc.rect(margin + approvalWidth, currentY, approvalWidth, approvalHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // Increased from 7
    doc.text('Prepared by', margin + 1, currentY + 5);
    doc.text('Checked By', margin + approvalWidth + 1, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const preparedByText = truncateText(doc, formData.formData.preparedBy || '', approvalWidth - 2, 8);
    const checkedByText = truncateText(doc, formData.formData.checkedBy || '', approvalWidth - 2, 8);
    doc.text(preparedByText, margin + 1, currentY + 13);
    doc.text(checkedByText, margin + approvalWidth + 1, currentY + 13);
    
    currentY += approvalHeight;
    
    // Bottom row: Recommended by (First) | Recommended by (Second)
    doc.rect(margin, currentY, approvalWidth, approvalHeight);
    doc.rect(margin + approvalWidth, currentY, approvalWidth, approvalHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Recommended by (First)', margin + 1, currentY + 5);
    doc.text('Recommended by (Second)', margin + approvalWidth + 1, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    const recommendedByFirstText = truncateText(doc, formData.formData.recommendedByFirst || '', approvalWidth - 2, 8);
    const recommendedBySecondText = truncateText(doc, formData.formData.recommendedBySecond || '', approvalWidth - 2, 8);
    doc.text(recommendedByFirstText, margin + 1, currentY + 13);
    doc.text(recommendedBySecondText, margin + approvalWidth + 1, currentY + 13);
    
    currentY += approvalHeight + 3; // Reduced spacing
    
    // Certification text - compressed
    doc.setFontSize(7); // Increased from 6
    const certificationText = 'I certify from personal knowledge*/ from the certificates in the relevant files*/ that the above supplies*/ services*/ works* were duly authorised and performed and that the payment of Rupees ________________and cents _______ is in accordance with regulations*/ contract*/ fair and reasonable.';
    
    const certificationLines = wrapText(doc, certificationText, usableWidth, 7);
    let certY = currentY;
    certificationLines.slice(0, 2).forEach(line => { // Limit to 2 lines
        doc.text(line, margin, certY);
        certY += 3;
    });
    
    currentY += 8; // Reduced spacing
    
    // Final approval section - compact
    const finalApprovalHeight = 22; // Reduced from 35
    
    // Payment Approved By | Voucher Certified By
    doc.rect(margin, currentY, approvalWidth, finalApprovalHeight);
    doc.rect(margin + approvalWidth, currentY, approvalWidth, finalApprovalHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // Increased from 7
    doc.text('Payment Approved By', margin + 1, currentY + 5);
    doc.text('Voucher Certified By', margin + approvalWidth + 1, currentY + 5);
    
    doc.setFontSize(7); // Increased from 6
    doc.text('(FR 137 Approval)', margin + 1, currentY + 9);
    doc.text('(FR 138 Voucher Certification)', margin + approvalWidth + 1, currentY + 9);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const paymentApprovedByText = truncateText(doc, formData.formData.paymentApprovedBy || '', approvalWidth - 2, 8);
    const voucherCertifiedByText = truncateText(doc, formData.formData.voucherCertifiedBy || '', approvalWidth - 2, 8);
    
    doc.text(paymentApprovedByText, margin + 1, currentY + 17);
    doc.text(voucherCertifiedByText, margin + approvalWidth + 1, currentY + 17);
    
    currentY += finalApprovalHeight + 3; // Reduced spacing
    
    // Documents section - compact final section
    const documentsHeight = 40; // Reduced from 60
    
    doc.rect(margin, currentY, approvalWidth, documentsHeight);
    doc.rect(margin + approvalWidth, currentY, approvalWidth, documentsHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7); // Increased from 6
    doc.text('Attached the Copies of following Documents', margin + 1, currentY + 4);
    doc.text('Other Documents Attached', margin + approvalWidth + 1, currentY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6); // Increased from 5
    let docY = currentY + 8;
    
    // Document mapping for checkbox names to display names
    const documentMapping = {
        'doc-invoice': 'Invoice',
        'doc-board-approval': 'Board Approval', 
        'doc-fr136': 'FR 136 Approval',
        'doc-procurement': 'DG/Adm/Procurement Approval',
        'doc-grn': 'Good Received Note (GRN)',
        'doc-acceptance': 'Good Acceptance Committee Report',
        'doc-service': 'Service Completed Report'
    };
    
    // Only show checked documents
    const checkedDocuments = [];
    Object.keys(documentMapping).forEach(docKey => {
        if (formData.documents && formData.documents[docKey]) {
            checkedDocuments.push(documentMapping[docKey]);
        }
    });
    
    // Debug log
    console.log('PDF Generation - Document Status:', formData.documents);
    console.log('PDF Generation - Checked Documents:', checkedDocuments);
    
    // Display checked documents or "None" if no documents are checked
    if (checkedDocuments.length > 0) {
        checkedDocuments.forEach(docName => {
            if (docY < currentY + documentsHeight - 2) {
                doc.text(`• ${docName}`, margin + 2, docY);
                docY += 4; // Reduced spacing
            }
        });
    } else {
        doc.text('• None selected', margin + 2, docY);
    }
    
    // Other documents - show actual content from textarea
    doc.setFontSize(5);
    let otherDocY = currentY + 8;
    const otherDocsText = formData.formData.otherDocuments || '';
    
    if (otherDocsText.trim()) {
        // Split long text into multiple lines
        const otherDocsLines = wrapText(doc, otherDocsText, approvalWidth - 4, 5);
        otherDocsLines.slice(0, 8).forEach(line => { // Limit to available space
            if (otherDocY < currentY + documentsHeight - 2) {
                doc.text(line, margin + approvalWidth + 2, otherDocY);
                otherDocY += 3; // Smaller line spacing for other docs
            }
        });
    } else {
        doc.text('• None specified', margin + approvalWidth + 2, otherDocY);
    }
    
    // Save PDF with proper filename
    const fileName = `SLTB_${title.replace(/\s+/g, '_')}_${formData.formData.voucherNo || 'draft'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showMessage('PDF generated successfully with proper text formatting!', 'success');
}

// Print voucher
function printVoucher() {
    window.print();
}

// Show message
function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const mainContent = document.getElementById('main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Debug function to test default settings
function testDefaultSettings() {
    console.log('Current default settings:', defaultSettings);
    console.log('LocalStorage data:', localStorage.getItem('sltb-defaults'));
}

// Test auto-fill functionality
function testAutoFill() {
    // First save current form data as defaults
    saveDefaults();
    
    // Then show a message and redirect to test with a payment voucher
    const statusDiv = document.getElementById('defaults-status');
    if (statusDiv) {
        statusDiv.innerHTML = '<div class="message info">Testing auto-fill... Creating a Payment Voucher to test the functionality. Check if your default values appear automatically!</div>';
        
        setTimeout(() => {
            loadVoucherForm('payment');
        }, 2000);
    }
}

// Load defaults into current form manually
function loadDefaultsToForm() {
    try {
        console.log('=== loadDefaultsToForm() called ===');
        
        // Reload defaults first to get latest values
        loadDefaults();
        console.log('Loaded defaultSettings:', defaultSettings);
        
        if (!defaultSettings || Object.keys(defaultSettings).length === 0) {
            console.log('No default settings found');
            showMessage('No default settings found. Please save defaults first in Default Settings page.', 'warning');
            return;
        }
        
        // Check localStorage directly
        const stored = localStorage.getItem('sltb-defaults');
        console.log('Direct localStorage check:', stored);
        
        // Apply defaults to current form
        console.log('Starting form population...');
        populateFormDefaultsSimplified();
        
        // Show success message
        const count = Object.keys(defaultSettings).length;
        showMessage(`✅ Smart defaults loaded! ${count} fields now have default placeholders. Manual entries will override defaults in PDF.`, 'success');
        console.log('Manual load defaults completed successfully');
        
    } catch (error) {
        console.error('Error in loadDefaultsToForm:', error);
        showMessage('Error loading defaults: ' + error.message, 'error');
    }
}

// Simplified populate function that won't cause freezing - Auto-fills all matching form fields
function populateFormDefaultsSimplified() {
    console.log('🔄 Starting auto-fill of form with saved defaults:', defaultSettings);
    
    if (!defaultSettings || Object.keys(defaultSettings).length === 0) {
        console.log('ℹ️ No saved defaults found - form will remain empty until defaults are saved');
        return;
    }
    
    console.log(`📝 Auto-filling ${Object.keys(defaultSettings).length} default values into current form...`);
    
    // Debug: Check what preparedBy elements are available
    const allPreparedByInputs = document.querySelectorAll('input[name="preparedBy"]');
    console.log('🔍 DEBUG: Found preparedBy inputs:', allPreparedByInputs.length);
    allPreparedByInputs.forEach((input, index) => {
        console.log(`   preparedBy input ${index}:`, {
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            value: input.value,
            visible: input.offsetParent !== null
        });
    });
    
    // Set today's date first
    const dateInput = document.getElementById('voucher-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
        console.log('Set voucher date to today');
    }
    
    Object.keys(defaultSettings).forEach(key => {
        const value = defaultSettings[key];
        if (!value || value.trim() === '') return;
        
        let element = null;
        
        // Strategy 1: Try by name attribute first (most common in voucher forms)
        element = document.querySelector(`[name="${key}"]`);
        
        // Strategy 2: Try by ID
        if (!element) {
            element = document.getElementById(key);
        }
        
        // Strategy 3: Try common ID patterns for default settings
        if (!element) {
            const commonIdMappings = {
                'sltbSection': 'sltb-section',
                'fileReference': 'file-reference',
                'preparedBy': 'prepared-by',
                'checkedBy': 'checked-by',
                'approvedBy': 'approved-by',
                'authorizedBy': 'authorized-by',
                'recommendedByFirst': 'recommended-by-first',
                'recommendedBySecond': 'recommended-by-second',
                'paymentApprovedBy': 'payment-approved-by',
                'voucherCertifiedBy': 'voucher-certified-by'
            };
            
            const mappedId = commonIdMappings[key];
            if (mappedId) {
                element = document.getElementById(mappedId);
            }
        }
        
        // Strategy 4: Try exact name matching first
        if (!element) {
            element = document.querySelector(`input[name="${key}"]`) || 
                     document.querySelector(`select[name="${key}"]`) || 
                     document.querySelector(`textarea[name="${key}"]`);
            
            // Special handling for preparedBy - it exists in forms but might not be found
            if (!element && key === 'preparedBy') {
                // Try all possible selectors for preparedBy
                const selectors = [
                    'input[name="preparedBy"]',
                    'input[id="prepared-by"]',
                    'input[placeholder*="Name"]:first-of-type', // First name input might be preparedBy
                    '.approval-section input[type="text"]:first-of-type' // First input in approval section
                ];
                
                for (const selector of selectors) {
                    try {
                        element = document.querySelector(selector);
                        if (element) {
                            console.log(`Found preparedBy using special selector: ${selector}`);
                            break;
                        }
                    } catch (e) {
                        console.log(`Selector failed: ${selector}`, e);
                    }
                }
            }
        }
        
        // Strategy 5: Try input with placeholder matching (fallback)
        if (!element) {
            const possibleSelectors = [
                `input[placeholder*="${key}"]`,
                `input[name*="${key.toLowerCase()}"]`,
                `select[name*="${key.toLowerCase()}"]`,
                `textarea[name*="${key.toLowerCase()}"]`,
                // Also try case variations
                `input[name*="${key}"]`,
                `select[name*="${key}"]`,
                `textarea[name*="${key}"]`,
                // Try ID patterns
                `input[id*="${key.toLowerCase()}"]`,
                `select[id*="${key.toLowerCase()}"]`,
                `textarea[id*="${key.toLowerCase()}"]`,
                // Try with dashes
                `input[name*="${key.replace(/([A-Z])/g, '-$1').toLowerCase()}"]`,
                `select[name*="${key.replace(/([A-Z])/g, '-$1').toLowerCase()}"]`,
                `textarea[name*="${key.replace(/([A-Z])/g, '-$1').toLowerCase()}"]`
            ];
            
            for (const selector of possibleSelectors) {
                try {
                    element = document.querySelector(selector);
                    if (element) {
                        console.log(`Found ${key} using selector: ${selector}`);
                        break;
                    }
                } catch (e) {
                    // Continue if selector is invalid
                }
            }
        }
        
        if (element) {
            try {
                console.log(`Found element for ${key}:`, element.tagName, element.name || 'no-name', element.id || 'no-id');
                
                // Special debug for preparedBy
                if (key === 'preparedBy') {
                    console.log('DEBUG preparedBy - Element found:', element);
                    console.log('DEBUG preparedBy - Element tag:', element.tagName);
                    console.log('DEBUG preparedBy - Element name:', element.name);
                    console.log('DEBUG preparedBy - Element id:', element.id);
                    console.log('DEBUG preparedBy - Current value:', element.value);
                    console.log('DEBUG preparedBy - Will set placeholder to:', value);
                }
                
                // Skip if element is disabled or readonly and user wants to be able to edit
                if (element.disabled || element.readOnly) {
                    console.log(`Skipping ${key} - element is disabled/readonly`);
                    return;
                }
                
                if (element.tagName === 'SELECT') {
                    // Check if option exists before setting
                    const hasOption = Array.from(element.options).some(option => option.value === value);
                    if (hasOption) {
                        element.value = value;
                        console.log(`✓ Auto-filled select ${key}: "${value}"`);
                    } else {
                        console.warn(`✗ Option "${value}" not found in select ${key}`);
                        // Try to add the option if it's a text value
                        if (element.options.length > 0) {
                            const newOption = document.createElement('option');
                            newOption.value = value;
                            newOption.textContent = value;
                            element.appendChild(newOption);
                            element.value = value;
                            console.log(`✓ Added and selected new option for ${key}: "${value}"`);
                        }
                    }
                } else if (element.type === 'checkbox') {
                    // Handle checkboxes
                    element.checked = value === 'true' || value === true || value === '1';
                    console.log(`✓ Auto-filled checkbox ${key}: ${element.checked}`);
                } else if (element.type === 'radio') {
                    // Handle radio buttons
                    if (element.value === value) {
                        element.checked = true;
                        console.log(`✓ Auto-filled radio ${key}: ${value}`);
                    }
                } else {
                    // Handle text inputs, textareas, etc. - USE PLACEHOLDERS instead of overwriting values
                    const oldValue = element.value;
                    
                    // Special detailed debug for preparedBy
                    if (key === 'preparedBy') {
                        console.log('🔍 DETAILED DEBUG for preparedBy:');
                        console.log('   - Element:', element);
                        console.log('   - Current value:', `"${oldValue}"`);
                        console.log('   - Current placeholder:', `"${element.placeholder}"`);
                        console.log('   - Default value to set:', `"${value}"`);
                    }
                    
                    // Only set default if field is empty (preserve manual data)
                    if (!oldValue || oldValue.trim() === '') {
                        // Set as placeholder instead of value
                        element.placeholder = value;
                        element.setAttribute('data-default-value', value); // Store default for PDF generation
                        console.log(`✓ Set placeholder for ${element.type || 'input'} ${key}: "${value}"`);
                        
                        // Additional debug for preparedBy
                        if (key === 'preparedBy') {
                            console.log('✅ preparedBy placeholder set successfully!');
                            console.log('   - New placeholder:', `"${element.placeholder}"`);
                        }
                    } else {
                        // Field has manual data - just store default for fallback
                        element.setAttribute('data-default-value', value);
                        console.log(`ℹ️ Manual data preserved for ${key}: "${oldValue}" (default available: "${value}")`);
                    }
                }
                
                // Trigger change event to update any listeners
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('input', { bubbles: true }));
                
            } catch (error) {
                console.warn(`✗ Error setting ${key}:`, error);
            }
        } else {
            console.warn(`✗ Field not found for key: ${key} - no matching element found`);
            
            // Special fallback for preparedBy
            if (key === 'preparedBy') {
                console.log('🔍 FALLBACK: Trying manual search for preparedBy...');
                const manualSearch = document.querySelector('input[name="preparedBy"]');
                console.log('   Manual search result:', manualSearch);
                
                if (manualSearch) {
                    console.log('✅ Found preparedBy via manual search! Setting placeholder...');
                    try {
                        const oldValue = manualSearch.value;
                        if (!oldValue || oldValue.trim() === '') {
                            manualSearch.placeholder = value;
                            manualSearch.setAttribute('data-default-value', value);
                            console.log('✅ preparedBy placeholder set via fallback!');
                        } else {
                            manualSearch.setAttribute('data-default-value', value);
                            console.log('ℹ️ preparedBy has manual data, storing as fallback');
                        }
                    } catch (error) {
                        console.error('Error in preparedBy fallback:', error);
                    }
                } else {
                    console.log('❌ Manual search for preparedBy also failed');
                }
            }
        }
    });
    
    console.log('✓ Auto-fill form population completed - all matching fields filled with defaults!');
}

// Make sure the function is available globally
window.loadDefaultsToForm = loadDefaultsToForm;

// Helper function to get effective value (manual data or default fallback)
function getEffectiveValue(element) {
    if (!element) return '';
    
    // If element has manual data (value), use it
    if (element.value && element.value.trim() !== '') {
        console.log(`Using manual data for ${element.name || element.id}:`, element.value);
        return element.value;
    }
    
    // Otherwise, use stored default value
    const defaultValue = element.getAttribute('data-default-value');
    if (defaultValue) {
        console.log(`Using default value for ${element.name || element.id}:`, defaultValue);
        return defaultValue;
    }
    
    return '';
}

// Helper function to get effective value by field name/id
function getEffectiveValueByField(fieldName) {
    // Try multiple selectors to find the field
    const selectors = [
        `[name="${fieldName}"]`,
        `#${fieldName}`,
        `#${fieldName.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    ];
    
    for (const selector of selectors) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                return getEffectiveValue(element);
            }
        } catch (e) {
            // Continue to next selector
        }
    }
    
    return '';
}

// Simple test function to create only "Prepared by" default for auto-fill testing
function createTestDefaults() {
    const testDefaults = {
        // Only "Prepared by" field
        'preparedBy': 'John Doe'
    };
    
    localStorage.setItem('sltb-defaults', JSON.stringify(testDefaults));
    defaultSettings = testDefaults;
    console.log('✅ Created simple test default for auto-fill:', testDefaults);
    showMessage(`✅ Simple default created! Only "Prepared by" will auto-fill across all forms.`, 'success');
}

// Make test function available globally
window.createTestDefaults = createTestDefaults;

// Debug function to check available form fields
function debugFormFields() {
    const allInputs = document.querySelectorAll('input, select, textarea');
    console.log('=== Available Form Fields ===');
    allInputs.forEach(input => {
        if (input.name || input.id) {
            console.log(`${input.tagName}: name="${input.name}" id="${input.id}" type="${input.type}"`);
        }
    });
    console.log('=== End Form Fields ===');
}

window.debugFormFields = debugFormFields;

// Function to check what defaults are currently saved
function checkSavedDefaults() {
    const stored = localStorage.getItem('sltb-defaults');
    if (stored) {
        const parsed = JSON.parse(stored);
        console.log('=== CURRENTLY SAVED DEFAULTS ===');
        console.table(parsed);
        showMessage(`Found ${Object.keys(parsed).length} saved defaults. Check console for details.`, 'info');
        return parsed;
    } else {
        console.log('No defaults found in localStorage');
        showMessage('No defaults found. Please save some defaults first.', 'warning');
        return null;
    }
}

window.checkSavedDefaults = checkSavedDefaults;

// Helper function to clear all form fields for testing auto-fill
function clearAllFormFields() {
    const allInputs = document.querySelectorAll('input, select, textarea');
    let clearedCount = 0;
    
    allInputs.forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit' && input.type !== 'reset') {
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
            clearedCount++;
        }
    });
    
    console.log(`🧹 Cleared ${clearedCount} form fields`);
    showMessage(`Cleared ${clearedCount} form fields. Now switch forms to see auto-fill in action!`, 'info');
}

window.clearAllFormFields = clearAllFormFields;

