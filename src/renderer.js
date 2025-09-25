const { ipcRenderer } = require('electron');

// Global variables
let currentVoucherType = 'welcome';
let expenditureCount = 0;
let defaultSettings = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadDefaults();
    loadVoucherForm('welcome');
    
    // Listen for menu events
    ipcRenderer.on('load-voucher', (event, voucherType) => {
        loadVoucherForm(voucherType);
    });
});

// Load default settings
function loadDefaults() {
    const stored = localStorage.getItem('sltb-defaults');
    if (stored) {
        defaultSettings = JSON.parse(stored);
        populateDefaultsForm();
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
    const stored = localStorage.getItem('sltb-defaults');
    if (stored) {
        defaultSettings = JSON.parse(stored);
    }
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
    for (let [key, value] of formData.entries()) {
        if (value.trim() !== '') { // Only save non-empty values
            defaultSettings[key] = value.trim();
        }
    }
    
    localStorage.setItem('sltb-defaults', JSON.stringify(defaultSettings));
    
    // Show success message
    const statusDiv = document.getElementById('defaults-status');
    if (statusDiv) {
        statusDiv.innerHTML = '<div class="message success">Default settings saved successfully! These values will now auto-fill in voucher forms.</div>';
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }
    
    showMessage('Default settings saved successfully!', 'success');
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
    
    Object.keys(defaultSettings).forEach(key => {
        // Try to find the element by name attribute
        let element = document.querySelector(`[name="${key}"]`);
        
        // If not found, try by id
        if (!element) {
            element = document.getElementById(key);
        }
        
        // If still not found, try common field mappings
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
        
        if (element && defaultSettings[key]) {
            console.log(`Setting ${key} to ${defaultSettings[key]}`);
            element.value = defaultSettings[key];
            
            // For select elements, make sure the option exists
            if (element.tagName === 'SELECT') {
                const option = element.querySelector(`option[value="${defaultSettings[key]}"]`);
                if (option) {
                    element.value = defaultSettings[key];
                } else {
                    console.warn(`Option not found for ${key}: ${defaultSettings[key]}`);
                }
            }
        }
    });
    
    // Set today's date
    const dateInput = document.getElementById('voucher-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
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

// Generate PDF document
function generatePDFDocument(jsPDF) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const formData = collectFormData();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header with logo space
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    // Add space for logo (you can add actual logo embedding here if needed)
    doc.text('Sri Lanka Tea Board', 105, 20, { align: 'center' });
    
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
    
    doc.text(title, 105, 30, { align: 'center' });
    
    // Voucher details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let y = 50;
    doc.text(`Voucher No: ${formData.formData.voucherNo || ''}`, 20, y);
    doc.text(`Date: ${formData.formData.voucherDate || ''}`, 150, y);
    y += 10;
    
    doc.text(`SLTB Section: ${formData.formData.sltbSection || ''}`, 20, y);
    doc.text(`File Reference: ${formData.formData.fileReference || ''}`, 150, y);
    y += 10;
    
    doc.text(`Payable To: ${formData.formData.payableTo || ''}`, 20, y);
    doc.text(`Expenditure Code: ${formData.formData.expenditureCode || ''}`, 150, y);
    y += 20;
    
    // Content based on voucher type
    if (currentVoucherType === 'payment' && formData.expenditures) {
        // Expenditure table for payment vouchers
        doc.setFont('helvetica', 'bold');
        doc.text('Expenditure Details:', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        formData.expenditures.forEach((exp, index) => {
            if (exp.desc) {
                doc.text(`${index + 1}. ${exp.desc}`, 20, y);
                y += 5;
                doc.text(`Rate: Rs. ${exp.rate || '0'} | Units: ${exp.units || '0'} | Amount: Rs. ${exp.amount || '0'}`, 25, y);
                y += 10;
            }
        });
        
        const total = document.getElementById('total-payment')?.textContent || '0.00';
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Payment: Rs. ${total}`, 20, y);
        y += 20;
    } else if (currentVoucherType === 'advance-settlement') {
        // Settlement details
        doc.setFont('helvetica', 'bold');
        doc.text('Settlement Details:', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Amount of Advance: Rs. ${formData.formData.amountAdvance || '0'}`, 20, y);
        y += 8;
        doc.text(`Amount Spent: Rs. ${formData.formData.amountSpent || '0'}`, 20, y);
        y += 8;
        doc.text(`Balance Due/Refund: Rs. ${formData.formData.balanceDue || '0'}`, 20, y);
        y += 20;
    } else {
        // Service description for advance payment and petty cash
        if (formData.formData.serviceDescription) {
            doc.setFont('helvetica', 'bold');
            doc.text('Service Description:', 20, y);
            y += 10;
            
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(formData.formData.serviceDescription, 170);
            doc.text(lines, 20, y);
            y += lines.length * 5 + 10;
            
            doc.text(`Rate: Rs. ${formData.formData.rate || '0'}`, 20, y);
            doc.text(`Units: ${formData.formData.units || '0'}`, 100, y);
            y += 8;
            doc.text(`Total Amount: Rs. ${formData.formData.totalPayment || '0'}`, 20, y);
            y += 20;
        }
    }
    
    // Approval section
    doc.setFont('helvetica', 'bold');
    doc.text('Approvals:', 20, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Prepared by: ${formData.formData.preparedBy || ''}`, 20, y);
    doc.text(`Checked by: ${formData.formData.checkedBy || ''}`, 110, y);
    y += 10;
    
    doc.text(`Recommended by (First): ${formData.formData.recommendedByFirst || ''}`, 20, y);
    y += 8;
    doc.text(`Recommended by (Second): ${formData.formData.recommendedBySecond || ''}`, 20, y);
    y += 8;
    doc.text(`Payment Approved by: ${formData.formData.paymentApprovedBy || ''}`, 20, y);
    y += 8;
    doc.text(`Voucher Certified by: ${formData.formData.voucherCertifiedBy || ''}`, 20, y);
    
    // Save PDF
    const fileName = `${formData.formData.voucherNo || 'voucher'}_${currentVoucherType}.pdf`;
    doc.save(fileName);
    
    showMessage('PDF generated successfully!', 'success');
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