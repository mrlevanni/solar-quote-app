// Global variables
let currentStep = 1;
let currentQuote = null;
let currentSystem = null;
let currentCustomer = null;
let equipmentData = null;
let companySettings = {
    name: 'Solar Energy Solutions',
    slogan: 'Năng lượng xanh cho tương lai',
    phone: '',
    email: '',
    address: '',
    logo: null
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadEquipmentData();
    setupEventListeners();
});

function setupEventListeners() {
    // Customer form submission
    document.getElementById('customerForm').addEventListener('submit', handleCustomerForm);
    
    // Auto-calculate consumption from bill
    document.getElementById('monthlyBill').addEventListener('input', calculateConsumptionFromBill);
    document.getElementById('electricityPrice').addEventListener('input', calculateConsumptionFromBill);
    
    // Auto-calculate daily consumption
    document.getElementById('monthlyConsumption').addEventListener('input', function() {
        const monthlyConsumption = parseFloat(this.value) || 0;
        document.getElementById('dailyConsumption').value = (monthlyConsumption / 30).toFixed(1);
    });
    
    // Auto-calculate evening usage
    document.getElementById('morningUsage').addEventListener('input', function() {
        const morningUsage = parseInt(this.value) || 0;
        const eveningUsage = Math.max(0, 100 - morningUsage);
        document.getElementById('eveningUsage').value = eveningUsage;
    });
    
    document.getElementById('eveningUsage').addEventListener('input', function() {
        const eveningUsage = parseInt(this.value) || 0;
        const morningUsage = Math.max(0, 100 - eveningUsage);
        document.getElementById('morningUsage').value = morningUsage;
    });
    
    // Logo preview for company settings
    document.getElementById('modalCompanyLogo').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('logoPreviewImg').src = e.target.result;
                document.getElementById('logoPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Load company settings to form when modal opens
    document.getElementById('companyModal').addEventListener('show.bs.modal', function() {
            document.getElementById('modalCompanyName').value = companySettings.name;
        document.getElementById('modalCompanySlogan').value = companySettings.slogan;
        document.getElementById('modalCompanyPhone').value = companySettings.phone;
        document.getElementById('modalCompanyEmail').value = companySettings.email;
        document.getElementById('modalCompanyAddress').value = companySettings.address;
    });
    
    // Reset modal when closed
    document.getElementById('companyModal').addEventListener('hidden.bs.modal', function() {
        // Reset to default state
        document.querySelector('#companyModal .modal-title').innerHTML = `
            <i class="fas fa-building me-2"></i>
            Cài đặt thông tin công ty
        `;
        
        const saveBtn = document.querySelector('#companyModal .btn-primary');
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Lưu cài đặt';
        saveBtn.onclick = saveCompanySettings;
    });
}

async function loadEquipmentData() {
    try {
        const response = await fetch('/api/equipment');
        equipmentData = await response.json();
        console.log('Equipment data loaded:', equipmentData);
    } catch (error) {
        console.error('Error loading equipment data:', error);
        showAlert('Lỗi khi tải dữ liệu thiết bị', 'danger');
    }
}

function calculateConsumptionFromBill() {
    const monthlyBill = parseFloat(document.getElementById('monthlyBill').value) || 0;
    const electricityPrice = parseFloat(document.getElementById('electricityPrice').value) || 2500;
    
    if (monthlyBill > 0 && electricityPrice > 0) {
        const monthlyConsumption = monthlyBill / electricityPrice;
        document.getElementById('monthlyConsumption').value = monthlyConsumption.toFixed(1);
        document.getElementById('dailyConsumption').value = (monthlyConsumption / 30).toFixed(1);
    }
}

async function handleCustomerForm(e) {
    e.preventDefault();
    
    const customerData = {
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        customerAddress: document.getElementById('customerAddress').value,
        monthlyBill: parseInt(document.getElementById('monthlyBill').value),
        monthlyConsumption: parseFloat(document.getElementById('monthlyConsumption').value) || null,
        electricityPrice: parseFloat(document.getElementById('electricityPrice').value) || 2500,
        savingsPercent: parseInt(document.getElementById('savingsPercent').value),
        morningUsage: parseInt(document.getElementById('morningUsage').value),
        eveningUsage: parseInt(document.getElementById('eveningUsage').value)
    };
    
    // Validate usage percentages
    if (customerData.morningUsage + customerData.eveningUsage !== 100) {
        showAlert('Tổng phần trăm sử dụng buổi sáng và tối phải bằng 100%', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/calculate-quote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentQuote = data.quote;
            currentSystem = data.system;
            currentCustomer = data.customer;
            displayQuote(data);
            goToStep(2);
        } else {
            showAlert(data.error || 'Lỗi khi tính toán báo giá', 'danger');
        }
    } catch (error) {
        console.error('Error calculating quote:', error);
        showAlert('Lỗi kết nối server', 'danger');
    } finally {
        showLoading(false);
    }
}

function displayQuote(data) {
    const { customer, system, quote } = data;
    
    // Ensure customer data exists
    if (!customer) {
        console.error('Customer data is missing');
        showAlert('Thiếu thông tin khách hàng', 'danger');
        return;
    }
    
    const quoteHTML = `
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5><i class="fas fa-user me-2"></i>Thông tin khách hàng: ${customer.name}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                ${customer.phone ? `<p><strong>Số điện thoại:</strong> ${customer.phone}</p>` : ''}
                                ${customer.address ? `<p><strong>Địa chỉ:</strong> ${customer.address}</p>` : ''}
                                <p><strong>Tiền điện hàng tháng:</strong> ${formatCurrency(customer.monthlyBill)}</p>
                                <p><strong>Tiêu thụ điện/tháng:</strong> ${customer.monthlyConsumption.toFixed(1)} kWh</p>
                                <p><strong>Tiêu thụ điện/ngày:</strong> ${customer.dailyConsumption.toFixed(1)} kWh</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Mức tiết kiệm mong muốn:</strong> ${customer.savingsPercent}%</p>
                                <p><strong>Giá điện:</strong> ${formatCurrency(customer.electricityPrice)}/kWh</p>
                                <p><strong>Sử dụng buổi sáng:</strong> ${customer.morningUsage.toFixed(1)} kWh/ngày</p>
                                <p><strong>Sử dụng buổi tối:</strong> ${customer.eveningUsage.toFixed(1)} kWh/ngày</p>
                                <p><strong>Công suất hệ thống:</strong> ${system.powerKW} kW</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header bg-success text-white">
                        <h5><i class="fas fa-list me-2"></i>Chi tiết báo giá</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Hạng mục</th>
                                        <th>Mã SP</th>
                                        <th>Tên sản phẩm</th>
                                        <th>SL</th>
                                        <th>Đơn giá</th>
                                        <th>Thành tiền</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${quote.items.map((item, index) => `
                                        <tr id="quote-item-${index}">
                                            <td>${item.category}</td>
                                            <td><small>${item.code}</small></td>
                                            <td>
                                                ${item.name}
                                                <br><small class="text-muted">Bảo hành: ${item.warranty}</small>
                                            </td>
                                            <td>
                                                <span class="editable-quantity" data-index="${index}">${item.quantity}</span> ${item.unit}
                                            </td>
                                            <td>${formatCurrency(item.unitPrice)}</td>
                                            <td><strong class="item-total-${index}">${formatCurrency(item.totalPrice)}</strong></td>
                                            <td>
                                                ${item.category !== 'Phụ kiện' ? `
                                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editQuoteItem(${index}, '${item.category}')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                ` : ''}
                                                <input type="number" class="form-control form-control-sm d-inline-block" 
                                                       style="width: 60px;" value="${item.quantity}" min="1" 
                                                       onchange="updateQuantity(${index}, this.value)">
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot>
                                    <tr class="table-light">
                                        <th colspan="6">Tạm tính</th>
                                        <th id="quote-subtotal">${formatCurrency(quote.subtotal)}</th>
                                    </tr>
                                    <tr class="table-light">
                                        <th colspan="6">VAT (10%)</th>
                                        <th id="quote-vat">${formatCurrency(quote.vat)}</th>
                                    </tr>
                                    <tr class="table-warning">
                                        <th colspan="6">Tổng cộng</th>
                                        <th class="price-highlight" id="quote-total">${formatCurrency(quote.total)}</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="savings-card mb-3">
                    <h5><i class="fas fa-piggy-bank me-2"></i>Tiết kiệm dự kiến</h5>
                    <p class="h4">${formatCurrency(customer.targetSavings * customer.electricityPrice)} / tháng</p>
                    <p class="mb-0">≈ ${formatCurrency(customer.targetSavings * customer.electricityPrice * 12)} / năm</p>
                    <small>Dựa trên giá điện ${formatCurrency(customer.electricityPrice)}/kWh</small>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h6><i class="fas fa-credit-card me-2"></i>Phương án trả góp</h6>
                    </div>
                    <div class="card-body">
                        ${quote.installmentOptions.map(option => `
                            <div class="d-flex justify-content-between mb-2">
                                <span>${option.months} tháng:</span>
                                <strong>${formatCurrency(option.monthlyPayment)}/tháng</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h6><i class="fas fa-info-circle me-2"></i>Thông số hệ thống</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Tấm pin:</strong> ${system.pv.quantity} tấm × ${system.pv.item.powerW}W</p>
                        <p><strong>Inverter:</strong> ${system.inverter.item.name}</p>
                        <p><strong>Pin lưu trữ:</strong> ${system.battery.totalCapacity} kWh</p>
                        <p><strong>Tổng công suất:</strong> ${system.pv.totalPower} kW</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-4">
            <button class="btn btn-outline-secondary me-2" onclick="goToStep(1)">
                <i class="fas fa-arrow-left me-2"></i>
                Quay lại
            </button>
            <button class="btn btn-warning me-2" onclick="recalculateCurrentQuote()">
                <i class="fas fa-sync-alt me-2"></i>
                Tính lại báo giá
            </button>
            <button class="btn btn-solar" onclick="showCompanyInfoForPDF()">
                <i class="fas fa-file-pdf me-2"></i>
                Xuất PDF
            </button>
        </div>
    `;
    
    document.getElementById('quoteResult').innerHTML = quoteHTML;
}

function goToStep(step) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 < step) {
            stepEl.classList.add('completed');
        } else if (index + 1 === step) {
            stepEl.classList.add('active');
        }
    });
    
    // Show target section
    document.getElementById(`section${step}`).classList.add('active');
    currentStep = step;
    
    // No longer need step 3 initialization
}

// initializeCustomizeSection removed - using inline editing instead

// Old recalculateQuote and displayUpdatedQuote functions removed - using inline editing instead

async function generatePDF(customCompanyInfo = null) {
    const companyInfo = customCompanyInfo || {
        name: companySettings.name,
        slogan: companySettings.slogan,
        phone: companySettings.phone,
        email: companySettings.email,
        address: companySettings.address
    };
    
    // Use logo from company settings if available and not already set
    if (!companyInfo.logoBase64 && companySettings.logo) {
        companyInfo.logoBase64 = companySettings.logo; // Keep full data URL for PDF
    }
    
    // No fallback needed since we use modal for logo upload
    
    // Check if we have current quote data
    if (!currentQuote || !currentSystem) {
        showAlert('Không có dữ liệu báo giá để xuất PDF', 'warning');
        return;
    }
    
    // Use current quote data
    const quoteData = {
        customer: currentCustomer,
        system: currentSystem,
        quote: currentQuote
    };
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quoteData, companyInfo })
        });
        
        if (response.ok) {
            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `BaoGia_${quoteData.customer.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert('Tạo PDF thành công!', 'success');
        } else {
            const errorData = await response.json();
            showAlert(errorData.error || 'Lỗi khi tạo PDF', 'danger');
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        showAlert('Lỗi kết nối server khi tạo PDF', 'danger');
    } finally {
        showLoading(false);
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Update quantity of a quote item
function updateQuantity(itemIndex, newQuantity) {
    if (!currentQuote || !currentQuote.items[itemIndex]) return;
    
    const item = currentQuote.items[itemIndex];
    const quantity = parseInt(newQuantity) || 1;
    
    // Update quantity and recalculate total price
    item.quantity = quantity;
    item.totalPrice = item.unitPrice * quantity;
    
    // Update display
    document.querySelector(`.item-total-${itemIndex}`).textContent = formatCurrency(item.totalPrice);
    document.querySelector(`.editable-quantity[data-index="${itemIndex}"]`).textContent = quantity;
    
    // Recalculate totals
    recalculateQuoteTotals();
}

// Edit quote item (change product)
function editQuoteItem(itemIndex, category) {
    if (!equipmentData) {
        showAlert('Đang tải dữ liệu thiết bị...', 'info');
        return;
    }
    
    const item = currentQuote.items[itemIndex];
    let options = [];
    
    switch(category) {
        case 'Tấm pin mặt trời':
            options = equipmentData.pvPanels;
            break;
        case 'Inverter':
            options = equipmentData.inverters;
            break;
        case 'Pin lưu trữ':
            options = equipmentData.batteries;
            break;
        default:
            return;
    }
    
    // Create modal for selection
    const modalHTML = `
        <div class="modal fade" id="editItemModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chọn ${category}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <select class="form-select" id="newItemSelect">
                            ${options.map(option => `
                                <option value="${option.code}" ${option.code === item.code ? 'selected' : ''}>
                                    ${option.name} - ${formatCurrency(option.price)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-primary" onclick="applyItemChange(${itemIndex}, '${category}')">
                            Áp dụng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('editItemModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    modal.show();
}

// Apply item change
function applyItemChange(itemIndex, category) {
    const selectedCode = document.getElementById('newItemSelect').value;
    let selectedItem = null;
    
    switch(category) {
        case 'Tấm pin mặt trời':
            selectedItem = equipmentData.pvPanels.find(pv => pv.code === selectedCode);
            break;
        case 'Inverter':
            selectedItem = equipmentData.inverters.find(inv => inv.code === selectedCode);
            break;
        case 'Pin lưu trữ':
            selectedItem = equipmentData.batteries.find(bat => bat.code === selectedCode);
            break;
    }
    
    if (selectedItem) {
        // Update current quote item
        const quoteItem = currentQuote.items[itemIndex];
        quoteItem.code = selectedItem.code;
        quoteItem.name = selectedItem.name;
        quoteItem.unitPrice = selectedItem.price;
        quoteItem.totalPrice = selectedItem.price * quoteItem.quantity;
        quoteItem.warranty = (selectedItem.warranty || selectedItem.note) + (selectedItem.warranty ? ' năm' : '');
        
        // Update system config if needed
        if (category === 'Tấm pin mặt trời') {
            currentSystem.pv.item = selectedItem;
            currentSystem.pv.totalPower = (selectedItem.powerW * currentSystem.pv.quantity) / 1000;
        } else if (category === 'Inverter') {
            currentSystem.inverter.item = selectedItem;
        } else if (category === 'Pin lưu trữ') {
            currentSystem.battery.item = selectedItem;
            currentSystem.battery.totalCapacity = selectedItem.capacity * currentSystem.battery.quantity;
        }
        
        // Refresh display
        displayQuote({ customer: currentCustomer, system: currentSystem, quote: currentQuote });
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
        modal.hide();
        
        showAlert('Đã cập nhật sản phẩm!', 'success');
    }
}

// Recalculate quote totals
function recalculateQuoteTotals() {
    if (!currentQuote) return;
    
    let subtotal = 0;
    currentQuote.items.forEach(item => {
        subtotal += item.totalPrice;
    });
    
    currentQuote.subtotal = subtotal;
    currentQuote.vat = Math.round(subtotal * 0.1);
    currentQuote.total = Math.round(subtotal * 1.1);
    currentQuote.totalUSD = Math.round(currentQuote.total / 24000);
    
    // Update installment options
    currentQuote.installmentOptions = [
        { months: 12, monthlyPayment: Math.round(currentQuote.total / 12) },
        { months: 24, monthlyPayment: Math.round(currentQuote.total / 24) },
        { months: 36, monthlyPayment: Math.round(currentQuote.total / 36) }
    ];
    
    // Update display
    document.getElementById('quote-subtotal').textContent = formatCurrency(currentQuote.subtotal);
    document.getElementById('quote-vat').textContent = formatCurrency(currentQuote.vat);
    document.getElementById('quote-total').textContent = formatCurrency(currentQuote.total);
}

// Recalculate current quote
function recalculateCurrentQuote() {
    recalculateQuoteTotals();
    showAlert('Đã tính lại báo giá!', 'success');
}

// Show company info modal for PDF generation
function showCompanyInfoForPDF() {
    // Reset modal title and button first
    document.querySelector('#companyModal .modal-title').innerHTML = `
        <i class="fas fa-file-pdf me-2"></i>
        Thông tin công ty cho PDF
    `;
    
    // Change save button to generate PDF
    const saveBtn = document.querySelector('#companyModal .btn-primary');
    saveBtn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Tạo PDF';
    saveBtn.onclick = generatePDFFromModal;
    
    // Open company modal
    const modal = new bootstrap.Modal(document.getElementById('companyModal'));
    modal.show();
}

// Generate PDF from modal
async function generatePDFFromModal() {
    const name = document.getElementById('modalCompanyName').value;
    const slogan = document.getElementById('modalCompanySlogan').value;
    const phone = document.getElementById('modalCompanyPhone').value;
    const email = document.getElementById('modalCompanyEmail').value;
    const address = document.getElementById('modalCompanyAddress').value;
    const logoInput = document.getElementById('modalCompanyLogo');
    const logoFile = logoInput ? logoInput.files[0] : null;
    
    if (!name) {
        showAlert('Vui lòng nhập tên công ty', 'warning');
        return;
    }
    
    // Update global settings
    companySettings.name = name;
    companySettings.slogan = slogan;
    companySettings.phone = phone;
    companySettings.email = email;
    companySettings.address = address;
    
    
    if (logoFile) {
        try {
            const logoBase64 = await fileToBase64(logoFile);
            companySettings.logo = logoBase64;
        } catch (error) {
            console.error('Error processing logo:', error);
            showAlert('Lỗi khi xử lý logo', 'danger');
            return;
        }
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('companyModal'));
    modal.hide();
    
    // Create company info object with updated values
    const companyInfo = {
        name: name,
        slogan: slogan,
        phone: phone,
        email: email,
        address: address
    };
    
    // Add logo if available
    if (companySettings.logo) {
        companyInfo.logoBase64 = companySettings.logo;
    }
    
    
    // Generate PDF with updated company info
    await generatePDF(companyInfo);
}

// Database upload function
async function uploadDatabase() {
    const fileInput = document.getElementById('databaseFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Vui lòng chọn file Excel', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('database', file);
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/upload-database', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Upload database thành công!', 'success');
            
            // Reload equipment data
            await loadEquipmentData();
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('databaseModal'));
            modal.hide();
            
            // Reset form
            fileInput.value = '';
        } else {
            showAlert(result.error || 'Lỗi khi upload database', 'danger');
        }
    } catch (error) {
        console.error('Error uploading database:', error);
        showAlert('Lỗi kết nối server', 'danger');
    } finally {
        showLoading(false);
    }
}

// Save company settings
async function saveCompanySettings() {
    const name = document.getElementById('modalCompanyName').value;
    const slogan = document.getElementById('modalCompanySlogan').value;
    const phone = document.getElementById('modalCompanyPhone').value;
    const email = document.getElementById('modalCompanyEmail').value;
    const address = document.getElementById('modalCompanyAddress').value;
    const logoInput = document.getElementById('modalCompanyLogo');
    const logoFile = logoInput ? logoInput.files[0] : null;
    
    if (!name) {
        showAlert('Vui lòng nhập tên công ty', 'warning');
        return;
    }
    
    // Update global settings
    companySettings.name = name;
    companySettings.slogan = slogan;
    companySettings.phone = phone;
    companySettings.email = email;
    companySettings.address = address;
    
    if (logoFile) {
        try {
            const logoBase64 = await fileToBase64(logoFile);
            companySettings.logo = logoBase64;
        } catch (error) {
            console.error('Error processing logo:', error);
            showAlert('Lỗi khi xử lý logo', 'danger');
            return;
        }
    }
    
    // Company settings saved to global variable - no form to update
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('companyModal'));
    modal.hide();
    
    showAlert('Lưu cài đặt thành công!', 'success');
}


// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (document.body.contains(alert)) {
            document.body.removeChild(alert);
        }
    }, 5000);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const sections = document.querySelectorAll('.form-section');
    
    if (show) {
        sections.forEach(section => section.style.display = 'none');
        loading.style.display = 'block';
    } else {
        loading.style.display = 'none';
        document.getElementById(`section${currentStep}`).style.display = 'block';
    }
}