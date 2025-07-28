const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PDFGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, '../views/pdf-template.html');
    }

    async generateQuotePDF(quoteData, companyInfo) {
        let browser = null;
        
        try {
            // Launch browser
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            
            const page = await browser.newPage();
            
            // Create HTML content
            const htmlContent = this.createPDFTemplate(quoteData, companyInfo);
            
            // Set content
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            
            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });
            
            return pdfBuffer;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    
    createPDFTemplate(quoteData, companyInfo) {
        const { customer, system, quote } = quoteData;
        const currentDate = new Date().toLocaleDateString('vi-VN');
        
        // Create footer contact info
        const footerParts = [];
        if (companyInfo.address) {
            footerParts.push(`Địa chỉ: ${companyInfo.address}`);
        }
        if (companyInfo.phone) {
            footerParts.push(`Điện thoại: ${companyInfo.phone}`);
        }
        if (companyInfo.email) {
            footerParts.push(`Email: ${companyInfo.email}`);
        }
        
        const footerContact = footerParts.length > 0 
            ? footerParts.join(' | ')
            : 'Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM | Điện thoại: 1900-SOLAR | Email: info@solar.vn';
        
        return `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Báo giá hệ thống điện mặt trời</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Times New Roman', serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                }
                
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 0;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #f39c12;
                    padding-bottom: 20px;
                }
                
                .company-info {
                    flex: 1;
                }
                
                .company-info h1 {
                    color: #f39c12;
                    font-size: 24px;
                    margin-bottom: 5px;
                }
                
                .company-info p {
                    color: #666;
                    font-style: italic;
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    object-fit: contain;
                }
                
                .quote-title {
                    text-align: center;
                    margin: 30px 0;
                    color: #2c3e50;
                }
                
                .quote-title h2 {
                    font-size: 20px;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }
                
                .customer-section {
                    margin-bottom: 25px;
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                }
                
                .customer-section h3 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                
                .customer-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                
                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    border-bottom: 1px dotted #ccc;
                }
                
                .system-overview {
                    margin-bottom: 25px;
                    padding: 15px;
                    border: 1px solid #27ae60;
                    border-radius: 5px;
                    background: #f1f8e9;
                }
                
                .system-overview h3 {
                    color: #27ae60;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                
                .system-specs {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    text-align: center;
                }
                
                .spec-item {
                    padding: 10px;
                    background: white;
                    border-radius: 5px;
                    border: 1px solid #e9ecef;
                }
                
                .spec-value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #27ae60;
                }
                
                .quote-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 11px;
                }
                
                .quote-table th,
                .quote-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                
                .quote-table th {
                    background: #f39c12;
                    color: white;
                    font-weight: bold;
                    text-align: center;
                }
                
                .quote-table .category {
                    background: #f8f9fa;
                    font-weight: bold;
                }
                
                .quote-table .price {
                    text-align: right;
                    font-weight: bold;
                }
                
                .total-section {
                    text-align: right;
                    margin-bottom: 30px;
                }
                
                .total-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    border-bottom: 1px dotted #ccc;
                    max-width: 300px;
                    margin-left: auto;
                }
                
                .total-final {
                    font-size: 16px;
                    font-weight: bold;
                    color: #f39c12;
                    border-bottom: 3px double #f39c12;
                    margin-top: 10px;
                }
                
                .savings-section {
                    background: #e8f5e8;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 25px;
                    border-left: 4px solid #27ae60;
                }
                
                .savings-section h3 {
                    color: #27ae60;
                    margin-bottom: 10px;
                }
                
                .savings-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .installment-section {
                    margin-bottom: 25px;
                }
                
                .installment-section h3 {
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                
                .installment-options {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                }
                
                .installment-option {
                    text-align: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    border: 1px solid #e9ecef;
                }
                
                .terms-section {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #ffc107;
                    margin-bottom: 25px;
                }
                
                .terms-section h3 {
                    color: #856404;
                    margin-bottom: 10px;
                }
                
                .terms-list {
                    list-style-type: disc;
                    margin-left: 20px;
                }
                
                .terms-list li {
                    margin-bottom: 5px;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding: 20px 0;
                    border-top: 2px solid #f39c12;
                    color: #666;
                }
                
                .signature-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 50px;
                    margin-top: 40px;
                    text-align: center;
                }
                
                .signature-box {
                    padding: 20px 0;
                }
                
                .signature-line {
                    border-top: 1px solid #333;
                    margin-top: 50px;
                    padding-top: 5px;
                }
                
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                    .page-break { page-break-before: always; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="company-info">
                        <h1>${companyInfo.name || 'Solar Energy Solutions'}</h1>
                        <p>${companyInfo.slogan || 'Năng lượng xanh cho tương lai'}</p>
                        <div>
                            ${companyInfo.phone ? `<span>Hotline: ${companyInfo.phone}</span>` : ''}
                            ${companyInfo.phone && companyInfo.email ? ' | ' : ''}
                            ${companyInfo.email ? `<span>Email: ${companyInfo.email}</span>` : ''}
                        </div>
                        ${companyInfo.address ? `<p>Địa chỉ: ${companyInfo.address}</p>` : ''}
                    </div>
                    ${companyInfo.logoBase64 ? `<img src="${companyInfo.logoBase64}" alt="Logo" class="logo">` : ''}
                </div>
                
                <!-- Quote Title -->
                <div class="quote-title">
                    <h2>Báo giá hệ thống điện mặt trời</h2>
                    <p>Ngày: ${currentDate} | Số: SQ-${Date.now().toString().slice(-6)}</p>
                </div>
                
                <!-- Customer Information -->
                <div class="customer-section">
                    <h3>THÔNG TIN KHÁCH HÀNG</h3>
                    <div class="customer-details">
                        <div>
                            <div class="detail-item">
                                <span>Tên khách hàng:</span>
                                <strong>${customer.name}</strong>
                            </div>
                            ${customer.phone ? `
                            <div class="detail-item">
                                <span>Số điện thoại:</span>
                                <strong>${customer.phone}</strong>
                            </div>` : ''}
                            ${customer.address ? `
                            <div class="detail-item">
                                <span>Địa chỉ:</span>
                                <strong>${customer.address}</strong>
                            </div>` : ''}
                            <div class="detail-item">
                                <span>Tiền điện hàng tháng:</span>
                                <strong>${this.formatCurrency(customer.monthlyBill)}</strong>
                            </div>
                            <div class="detail-item">
                                <span>Tiêu thụ điện/tháng:</span>
                                <strong>${(customer.monthlyConsumption || 0).toFixed(1)} kWh</strong>
                            </div>
                        </div>
                        <div>
                            <div class="detail-item">
                                <span>Mức tiết kiệm mong muốn:</span>
                                <strong>${customer.savingsPercent}%</strong>
                            </div>
                            <div class="detail-item">
                                <span>Sử dụng buổi sáng:</span>
                                <strong>${(customer.morningUsage || 0).toFixed(1)} kWh/ngày</strong>
                            </div>
                            <div class="detail-item">
                                <span>Sử dụng buổi tối:</span>
                                <strong>${(customer.eveningUsage || 0).toFixed(1)} kWh/ngày</strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- System Overview -->
                <div class="system-overview">
                    <h3>TỔNG QUAN HỆ THỐNG</h3>
                    <div class="system-specs">
                        <div class="spec-item">
                            <div>Tổng công suất</div>
                            <div class="spec-value">${system.pv.totalPower} kW</div>
                        </div>
                        <div class="spec-item">
                            <div>Số tấm pin</div>
                            <div class="spec-value">${system.pv.quantity} tấm</div>
                        </div>
                        <div class="spec-item">
                            <div>Dung lượng pin</div>
                            <div class="spec-value">${system.battery.totalCapacity} kWh</div>
                        </div>
                    </div>
                </div>
                
                <!-- Quote Table -->
                <table class="quote-table">
                    <thead>
                        <tr>
                            <th style="width: 5%">STT</th>
                            <th style="width: 15%">Hạng mục</th>
                            <th style="width: 10%">Mã SP</th>
                            <th style="width: 35%">Tên sản phẩm</th>
                            <th style="width: 8%">SL</th>
                            <th style="width: 12%">Đơn giá</th>
                            <th style="width: 15%">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quote.items.map((item, index) => `
                            <tr>
                                <td style="text-align: center;">${index + 1}</td>
                                <td class="category">${item.category}</td>
                                <td style="font-size: 10px;">${item.code}</td>
                                <td>
                                    ${item.name}
                                    <br><small style="color: #666;">Bảo hành: ${item.warranty}</small>
                                </td>
                                <td style="text-align: center;">${item.quantity} ${item.unit}</td>
                                <td class="price">${this.formatCurrency(item.unitPrice)}</td>
                                <td class="price">${this.formatCurrency(item.totalPrice)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <!-- Total Section -->
                <div class="total-section">
                    <div class="total-item">
                        <span>Tạm tính:</span>
                        <span>${this.formatCurrency(quote.subtotal)}</span>
                    </div>
                    <div class="total-item">
                        <span>VAT (10%):</span>
                        <span>${this.formatCurrency(quote.vat)}</span>
                    </div>
                    <div class="total-item total-final">
                        <span>TỔNG CỘNG:</span>
                        <span>${this.formatCurrency(quote.total)}</span>
                    </div>
                </div>
                
                <!-- Savings Section -->
                <div class="savings-section">
                    <h3>DỰ KIẾN TIẾT KIỆM</h3>
                    <div class="savings-grid">
                        <div>
                            <strong>Tiết kiệm hàng tháng:</strong><br>
                            ${this.formatCurrency(customer.targetSavings * 2500)}
                        </div>
                        <div>
                            <strong>Tiết kiệm hàng năm:</strong><br>
                            ${this.formatCurrency(customer.targetSavings * 2500 * 12)}
                        </div>
                    </div>
                </div>
                
                <!-- Installment Options -->
                <div class="installment-section">
                    <h3>PHƯƠNG ÁN TRẢ GÓP</h3>
                    <div class="installment-options">
                        ${(quote.installmentOptions || []).map(option => `
                            <div class="installment-option">
                                <div><strong>${option.months} tháng</strong></div>
                                <div>${this.formatCurrency(option.monthlyPayment)}/tháng</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Terms and Conditions -->
                <div class="terms-section">
                    <h3>ĐIỀU KHOẢN VÀ ĐIỀU KIỆN</h3>
                    <ul class="terms-list">
                        <li>Báo giá có hiệu lực trong 30 ngày kể từ ngày lập.</li>
                        <li>Giá đã bao gồm VAT và chi phí lắp đặt cơ bản.</li>
                        <li>Thời gian thi công: 3-5 ngày làm việc sau khi ký hợp đồng.</li>
                        <li>Bảo hành tấm pin: 25 năm, inverter: 10-12 năm, pin lưu trữ: 10 năm.</li>
                        <li>Hỗ trợ làm thủ tục EVN và các giấy tờ pháp lý cần thiết.</li>
                        <li>Thanh toán: 50% khi ký hợp đồng, 50% khi hoàn thành lắp đặt.</li>
                    </ul>
                </div>
                
                <!-- Signature Section -->
                <div class="signature-section">
                    <div class="signature-box">
                        <strong>KHÁCH HÀNG</strong>
                        <div class="signature-line">
                            (Ký tên và ghi rõ họ tên)
                        </div>
                    </div>
                    <div class="signature-box">
                        <strong>NGƯỜI LẬP BÁO GIÁ</strong>
                        <div class="signature-line">
                            (Ký tên và ghi rõ họ tên)
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <p><strong>${companyInfo.name || 'Solar Energy Solutions'}</strong></p>
                    <p>${footerContact}</p>
                    <p style="font-style: italic; margin-top: 10px;">"${companyInfo.slogan || 'Năng lượng xanh cho tương lai'}"</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

module.exports = PDFGenerator;