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
        const element = form.querySelector(`[name="${key}"]`) || form.querySelector(`#default-${key}`);
        if (element) {
            element.value = defaultSettings[key] || '';
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
    
    // Initialize form with defaults
    setTimeout(() => {
        // Ensure defaults are loaded first
        loadDefaults();
        populateFormDefaults();
        if (type === 'payment') {
            addExpenditureRow();
        }
    }, 100);
}

// Generate Payment Voucher Form
function generatePaymentVoucherForm() {
    return `
    <div class="page active voucher-form" id="payment-voucher-form">
        <h2>Payment Voucher</h2>
        
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
                        <td colspan="3" class="text-right"><strong>SSCL VAT (%)</strong></td>
                        <td><input type="number" id="sscl-vat" name="ssclVat" step="0.01" onchange="calculateTotal()"></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-right"><strong>VAT (%)</strong></td>
                        <td><input type="number" id="vat" name="vat" step="0.01" onchange="calculateTotal()"></td>
                        <td></td>
                    </tr>
                    <tr>
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
        <h2>Advance Payment Voucher</h2>
        
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
            <h3>Service Details</h3>
            <div class="form-container">
                <div class="form-group">
                    <label for="service-description">Detailed description of service rendered, work executed or goods supplied and Certificate of Approving officer, where:</label>
                    <textarea id="service-description" name="serviceDescription" rows="4" required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="rate">Rate Rs.:</label>
                        <input type="number" id="rate" name="rate" step="0.01" onchange="calculateAdvanceTotal()">
                    </div>
                    <div class="form-group">
                        <label for="units">Units or Months:</label>
                        <input type="text" id="units" name="units" onchange="calculateAdvanceTotal()">
                    </div>
                    <div class="form-group">
                        <label for="amount">Amount Rs:</label>
                        <input type="number" id="amount" name="amount" step="0.01" readonly>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="total-payment"><strong>Total Payment Rs.:</strong></label>
                    <input type="number" id="total-payment" name="totalPayment" step="0.01" readonly>
                </div>
            </div>
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
        <h2>Advance Payment Settlement Voucher</h2>
        
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
        
        <div class="settlement-amounts">
            <h4>Settlement Details</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="amount-advance">Amount of Advance Rs.:</label>
                    <input type="number" id="amount-advance" name="amountAdvance" step="0.01" onchange="calculateSettlement()" required>
                </div>
                <div class="form-group">
                    <label for="amount-spent">Amount spent as per attached Documents Rs.:</label>
                    <input type="number" id="amount-spent" name="amountSpent" step="0.01" onchange="calculateSettlement()" required>
                </div>
                <div class="form-group">
                    <label for="balance-due">Balance due / refund Rs.:</label>
                    <input type="number" id="balance-due" name="balanceDue" step="0.01" readonly>
                </div>
            </div>
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
        <h2>Petty Cash Voucher</h2>
        
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
            <h3>Service Details</h3>
            <div class="form-container">
                <div class="form-group">
                    <label for="service-description">Detailed description of service rendered, work executed or goods supplied and Certificate of Approving officer, where:</label>
                    <textarea id="service-description" name="serviceDescription" rows="4" required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="rate">Rate Rs.:</label>
                        <input type="number" id="rate" name="rate" step="0.01" onchange="calculatePettyCashTotal()">
                    </div>
                    <div class="form-group">
                        <label for="units">Units or Months:</label>
                        <input type="text" id="units" name="units" onchange="calculatePettyCashTotal()">
                    </div>
                    <div class="form-group">
                        <label for="amount">Amount Rs:</label>
                        <input type="number" id="amount" name="amount" step="0.01" readonly>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="total-payment"><strong>Total Payment Rs.:</strong></label>
                    <input type="number" id="total-payment" name="totalPayment" step="0.01" readonly>
                </div>
            </div>
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
        <td><textarea name="expenditure-desc-${expenditureCount}" placeholder="Description..." rows="2"></textarea></td>
        <td><input type="number" name="expenditure-rate-${expenditureCount}" step="0.01" class="rate-input" onchange="calculateRowTotal(${expenditureCount})"></td>
        <td><input type="text" name="expenditure-units-${expenditureCount}" class="units-input" onchange="calculateRowTotal(${expenditureCount})"></td>
        <td><input type="number" name="expenditure-amount-${expenditureCount}" step="0.01" class="amount-input" readonly></td>
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
    amountInputs.forEach(input => {
        subtotal += parseFloat(input.value) || 0;
    });
    
    // Add taxes
    const ssclVat = parseFloat(document.getElementById('sscl-vat')?.value) || 0;
    const vat = parseFloat(document.getElementById('vat')?.value) || 0;
    
    const ssclAmount = (subtotal * ssclVat) / 100;
    const vatAmount = (subtotal * vat) / 100;
    
    const total = subtotal + ssclAmount + vatAmount;
    
    const totalElement = document.getElementById('total-payment');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2);
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

// Generate voucher number
function generateVoucherNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    
    const voucherNumber = `SLTB-${currentVoucherType.toUpperCase()}-${year}${month}${day}-${time}`;
    
    const voucherNoInput = document.getElementById('voucher-no');
    if (voucherNoInput) {
        voucherNoInput.value = voucherNumber;
    }
    
    showMessage('Voucher number generated successfully!', 'success');
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
    
    // Collect basic form data
    for (let [key, value] of formData.entries()) {
        data.formData[key] = value;
    }
    
    // Collect expenditure data for payment vouchers
    if (currentVoucherType === 'payment') {
        data.expenditures = [];
        for (let i = 1; i <= expenditureCount; i++) {
            const desc = document.querySelector(`[name="expenditure-desc-${i}"]`)?.value;
            const rate = document.querySelector(`[name="expenditure-rate-${i}"]`)?.value;
            const units = document.querySelector(`[name="expenditure-units-${i}"]`)?.value;
            const amount = document.querySelector(`[name="expenditure-amount-${i}"]`)?.value;
            
            if (desc || rate || units || amount) {
                data.expenditures.push({ desc, rate, units, amount });
            }
        }
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
    if (data.expenditures && currentVoucherType === 'payment') {
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
        if (currentVoucherType === 'payment') {
            calculateTotal();
        } else if (currentVoucherType === 'advance-payment' || currentVoucherType === 'petty-cash') {
            calculateAdvanceTotal();
        } else if (currentVoucherType === 'advance-settlement') {
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

// Generate PDF document matching SLTB official template
function generatePDFDocument(jsPDF) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const formData = collectFormData();
    
    // Define page dimensions
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // Header Section
    doc.setLineWidth(0.5);
    
    // Logo placeholder (left side)
    doc.rect(margin, margin, 25, 25);
    doc.setFontSize(8);
    doc.text('SLTB', margin + 12.5, margin + 12.5, { align: 'center' });
    doc.text('LOGO', margin + 12.5, margin + 15, { align: 'center' });
    
    // Title section (center)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Sri Lanka Tea Board', pageWidth/2, margin + 10, { align: 'center' });
    
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
    
    doc.setFontSize(14);
    doc.text(title, pageWidth/2, margin + 20, { align: 'center' });
    
    // Voucher No and Date boxes (top right)
    const headerRight = pageWidth - margin - 60;
    doc.rect(headerRight, margin, 60, 12);
    doc.rect(headerRight, margin + 12, 60, 12);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Voucher No', headerRight + 2, margin + 8);
    doc.text('Date', headerRight + 2, margin + 20);
    
    doc.setFont('helvetica', 'normal');
    doc.text(formData.formData.voucherNo || '', headerRight + 25, margin + 8);
    doc.text(formData.formData.voucherDate || '', headerRight + 25, margin + 20);
    
    // Main content area starts
    let currentY = margin + 35;
    
    // Section and File Reference row
    doc.rect(margin, currentY, pageWidth - 2*margin, 8);
    doc.line(margin + 60, currentY, margin + 60, currentY + 8);
    doc.line(pageWidth/2, currentY, pageWidth/2, currentY + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SLTB Section', margin + 2, currentY + 5);
    doc.text('File Reference', pageWidth/2 + 2, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text(formData.formData.sltbSection || '', margin + 62, currentY + 5);
    doc.text(formData.formData.fileReference || '', pageWidth/2 + 52, currentY + 5);
    
    currentY += 8;
    
    // Payable To and Expenditure Code row
    doc.rect(margin, currentY, pageWidth - 2*margin, 8);
    doc.line(margin + 60, currentY, margin + 60, currentY + 8);
    doc.line(pageWidth/2, currentY, pageWidth/2, currentY + 8);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Payable To', margin + 2, currentY + 5);
    doc.text('Expenditure', pageWidth/2 + 2, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text(formData.formData.payee || formData.formData.payableTo || '', margin + 62, currentY + 5);
    doc.text(formData.formData.expenditureCode || '', pageWidth/2 + 52, currentY + 5);
    
    currentY += 15;
    
    // Expenditure table or settlement details
    if (currentVoucherType === 'advance-settlement') {
        // Special layout for Advance Settlement Voucher
        // Amount of Advance
        doc.rect(margin, currentY, (pageWidth - 2*margin)/2, 10);
        doc.rect((pageWidth - 2*margin)/2 + margin, currentY, (pageWidth - 2*margin)/2, 10);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Amount of Advance', margin + 2, currentY + 6);
        doc.text('Rs.', pageWidth - margin - 15, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.formData.amountAdvance || '', margin + 80, currentY + 6);
        
        currentY += 10;
        
        // Amount spent
        doc.rect(margin, currentY, (pageWidth - 2*margin)/2, 10);
        doc.rect((pageWidth - 2*margin)/2 + margin, currentY, (pageWidth - 2*margin)/2, 10);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Amount spent as per attached Documents', margin + 2, currentY + 6);
        doc.text('Rs.', pageWidth - margin - 15, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.formData.amountSpent || '', margin + 120, currentY + 6);
        
        currentY += 10;
        
        // Balance due
        doc.rect(margin, currentY, (pageWidth - 2*margin)/2, 10);
        doc.rect((pageWidth - 2*margin)/2 + margin, currentY, (pageWidth - 2*margin)/2, 10);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Balance due / refund', margin + 2, currentY + 6);
        doc.text('Rs.', pageWidth - margin - 15, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(formData.formData.balanceDue || '', margin + 80, currentY + 6);
        
        currentY += 20;
    } else {
        // Expenditure table for other vouchers
        const tableHeight = 60;
        const tableWidth = pageWidth - 2*margin;
        
        // Draw main expenditure table
        doc.rect(margin, currentY, tableWidth, tableHeight);
        
        // Column divisions - matching template proportions
        const col1Width = tableWidth * 0.5;
        const col2Width = tableWidth * 0.15;
        const col3Width = tableWidth * 0.15;
        const col4Width = tableWidth * 0.2;
        
        doc.line(margin + col1Width, currentY, margin + col1Width, currentY + tableHeight);
        doc.line(margin + col1Width + col2Width, currentY, margin + col1Width + col2Width, currentY + tableHeight);
        doc.line(margin + col1Width + col2Width + col3Width, currentY, margin + col1Width + col2Width + col3Width, currentY + tableHeight);
        
        // Header row
        doc.line(margin, currentY + 15, margin + tableWidth, currentY + 15);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailed description of service rendered,', margin + 2, currentY + 5);
        doc.text('work executed or goods supplied and', margin + 2, currentY + 8);
        doc.text('Certificate of Approving officer, where', margin + 2, currentY + 11);
        
        doc.text('Rate Rs.', margin + col1Width + 5, currentY + 8);
        doc.text('Units or', margin + col1Width + col2Width + 5, currentY + 6);
        doc.text('Months', margin + col1Width + col2Width + 5, currentY + 9);
        doc.text('Amount Rs', margin + col1Width + col2Width + col3Width + 5, currentY + 8);
        
        // Content rows (if any expenditures exist)
        if (formData.expenditures && formData.expenditures.length > 0) {
            let rowY = currentY + 18;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            
            formData.expenditures.forEach((exp, index) => {
                if (exp.desc && exp.desc.trim() && rowY < currentY + tableHeight - 15) {
                    const desc = exp.desc.substring(0, 80);
                    doc.text(desc, margin + 2, rowY);
                    doc.text(exp.rate || '0', margin + col1Width + 5, rowY);
                    doc.text(exp.units || '0', margin + col1Width + col2Width + 5, rowY);
                    doc.text(exp.amount || '0', margin + col1Width + col2Width + col3Width + 5, rowY);
                    rowY += 5;
                }
            });
        }
        
        // Total row
        doc.line(margin, currentY + tableHeight - 10, margin + tableWidth, currentY + tableHeight - 10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Total Payment Rs.', margin + col1Width + col2Width - 30, currentY + tableHeight - 5);
        doc.text(formData.totalAmount || '0.00', margin + col1Width + col2Width + col3Width + 5, currentY + tableHeight - 5);
        
        currentY += tableHeight + 10;
    }
    
    // Approval section
    const approvalWidth = (pageWidth - 2*margin) / 2;
    const approvalHeight = 40;
    
    // Left column - Prepared by and Recommended by (First)
    doc.rect(margin, currentY, approvalWidth, approvalHeight/2);
    doc.rect(margin, currentY + approvalHeight/2, approvalWidth, approvalHeight/2);
    
    // Right column - Checked By and Recommended by (Second)
    doc.rect(margin + approvalWidth, currentY, approvalWidth, approvalHeight/2);
    doc.rect(margin + approvalWidth, currentY + approvalHeight/2, approvalWidth, approvalHeight/2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Prepared by', margin + 2, currentY + 5);
    doc.text('Checked By', margin + approvalWidth + 2, currentY + 5);
    doc.text('Recommended by (First)', margin + 2, currentY + approvalHeight/2 + 5);
    doc.text('Recommended by (Second)', margin + approvalWidth + 2, currentY + approvalHeight/2 + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.text(formData.formData.preparedBy || '', margin + 2, currentY + 15);
    doc.text(formData.formData.checkedBy || '', margin + approvalWidth + 2, currentY + 15);
    doc.text(formData.formData.recommendedByFirst || '', margin + 2, currentY + approvalHeight/2 + 15);
    doc.text(formData.formData.recommendedBySecond || '', margin + approvalWidth + 2, currentY + approvalHeight/2 + 15);
    
    currentY += approvalHeight + 5;
    
    // Certification text
    doc.setFontSize(8);
    doc.text('I certify from personal knowledge*/ from the certificates in the relevant files*/ that the above supplies*/ services*/ works* were duly', margin, currentY);
    doc.text('authorised and performed and that the payment of Rupees ________________and cents _______ is in accordance with', margin, currentY + 4);
    doc.text('regulations*/ contract*/ fair and reasonable.', margin, currentY + 8);
    
    currentY += 15;
    
    // Final approval section
    doc.rect(margin, currentY, approvalWidth, 20);
    doc.rect(margin + approvalWidth, currentY, approvalWidth, 20);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Payment Approved By', margin + 2, currentY + 5);
    doc.text('Voucher Certified By', margin + approvalWidth + 2, currentY + 5);
    doc.text('(FR 137 Approval)', margin + 2, currentY + 8);
    doc.text('(FR 138 Voucher Certification)', margin + approvalWidth + 2, currentY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(formData.formData.paymentApprovedBy || '', margin + 2, currentY + 15);
    doc.text(formData.formData.voucherCertifiedBy || '', margin + approvalWidth + 2, currentY + 15);
    
    currentY += 25;
    
    // Documents section
    doc.rect(margin, currentY, approvalWidth, 50);
    doc.rect(margin + approvalWidth, currentY, approvalWidth, 50);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Attached the Copies of following Documents', margin + 2, currentY + 5);
    doc.text('Other Documents Attached', margin + approvalWidth + 2, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let docY = currentY + 10;
    const documents = [
        'Invoice', 'Board Approval', 'FR 136 Approval',
        'DG/Adm/Procurment Approval', 'Good Received Note (GRN)',
        'Good Acceptance Committee Report', 'Service Completed Report'
    ];
    
    documents.forEach(docName => {
        doc.text(`• ${docName}`, margin + 5, docY);
        docY += 4;
    });
    
    // Other documents
    doc.text('• Other related documents', margin + approvalWidth + 5, currentY + 10);
    
    // Save PDF with proper filename
    const fileName = `SLTB_${title.replace(/\s+/g, '_')}_${formData.formData.voucherNo || 'draft'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    showMessage('PDF generated successfully in SLTB official format!', 'success');
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
        showMessage(`Successfully loaded ${count} default values into form!`, 'success');
        console.log('Manual load defaults completed successfully');
        
    } catch (error) {
        console.error('Error in loadDefaultsToForm:', error);
        showMessage('Error loading defaults: ' + error.message, 'error');
    }
}

// Simplified populate function that won't cause freezing
function populateFormDefaultsSimplified() {
    console.log('Starting simplified form population with defaults:', defaultSettings);
    
    if (!defaultSettings || Object.keys(defaultSettings).length === 0) {
        console.log('No defaults to populate');
        return;
    }
    
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
        
        // Strategy 4: Try input with placeholder matching (fallback)
        if (!element) {
            const possibleSelectors = [
                `input[placeholder*="${key}"]`,
                `input[name*="${key.toLowerCase()}"]`,
                `select[name*="${key.toLowerCase()}"]`,
                `textarea[name*="${key.toLowerCase()}"]`
            ];
            
            for (const selector of possibleSelectors) {
                try {
                    element = document.querySelector(selector);
                    if (element) break;
                } catch (e) {
                    // Continue if selector is invalid
                }
            }
        }
        
        if (element) {
            try {
                console.log(`Found element for ${key}:`, element.tagName, element.name, element.id);
                
                if (element.tagName === 'SELECT') {
                    // Check if option exists before setting
                    const hasOption = Array.from(element.options).some(option => option.value === value);
                    if (hasOption) {
                        element.value = value;
                        console.log(`✓ Set select ${key} to "${value}" (now: "${element.value}")`);
                    } else {
                        console.warn(`✗ Option "${value}" not found in select ${key}`);
                        console.warn('Available options:', Array.from(element.options).map(o => o.value));
                    }
                } else {
                    const oldValue = element.value;
                    element.value = value;
                    console.log(`✓ Set input ${key} from "${oldValue}" to "${value}" (now: "${element.value}")`);
                }
                
                // Trigger change event to update any listeners
                element.dispatchEvent(new Event('change', { bubbles: true }));
                
            } catch (error) {
                console.warn(`✗ Error setting ${key}:`, error);
            }
        } else {
            console.warn(`✗ Field not found for key: ${key}`);
            console.warn('Searched for:', `[name="${key}"]`, `#${key}`);
        }
    });
    
    console.log('✓ Simplified form population completed');
}

// Make sure the function is available globally
window.loadDefaultsToForm = loadDefaultsToForm;

// Test function to create sample defaults if none exist
function createTestDefaults() {
    const testDefaults = {
        sltbSection: 'IT Section',
        fileReference: 'SLTB/IT/2025/001',
        preparedBy: 'John Doe',
        checkedBy: 'Jane Smith',
        recommendedByFirst: 'First Recommender',
        recommendedBySecond: 'Second Recommender',
        paymentApprovedBy: 'Payment Approver',
        voucherCertifiedBy: 'Voucher Certifier'
    };
    
    localStorage.setItem('sltb-defaults', JSON.stringify(testDefaults));
    defaultSettings = testDefaults;
    console.log('Created comprehensive test defaults:', testDefaults);
    showMessage('Complete test defaults created with all approval fields! Test the Load Defaults button now.', 'success');
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

