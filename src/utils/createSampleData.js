const XLSX = require('xlsx');
const path = require('path');

function createSampleExcel() {
    // Dữ liệu tấm pin PV
    const pvData = [
        ['Mã PV', 'Tên sản phẩm', 'Công suất (W)', 'Giá (VND)', 'Thương hiệu', 'Bảo hành (năm)'],
        ['PV-450-1', 'Tấm pin mono 450W Tier 1', 450, 2500000, 'JinkoSolar', 25],
        ['PV-540-1', 'Tấm pin mono 540W Tier 1', 540, 3200000, 'Longi', 25],
        ['PV-460-2', 'Tấm pin poly 460W', 460, 2200000, 'Canadian Solar', 25],
        ['PV-550-2', 'Tấm pin bifacial 550W', 550, 3500000, 'Trina Solar', 25],
        ['PV-400-3', 'Tấm pin mono 400W giá rẻ', 400, 1800000, 'JA Solar', 20]
    ];

    // Dữ liệu pin lưu trữ
    const batteryData = [
        ['Mã Pin', 'Tên sản phẩm', 'Dung lượng (kWh)', 'Giá (VND)', 'Thương hiệu', 'Bảo hành (năm)'],
        ['BAT-5-1', 'Pin Lithium 5kWh', 5, 45000000, 'Tesla Powerwall', 10],
        ['BAT-10-1', 'Pin Lithium 10kWh', 10, 85000000, 'LG Chem', 10],
        ['BAT-13-1', 'Pin Lithium 13.5kWh', 13.5, 120000000, 'Tesla Powerwall 2', 10],
        ['BAT-6-2', 'Pin Lithium 6.5kWh', 6.5, 55000000, 'BYD', 10],
        ['BAT-15-2', 'Pin Lithium 15kWh', 15, 140000000, 'Sonnen', 10]
    ];

    // Dữ liệu inverter
    const inverterData = [
        ['Mã Inverter', 'Tên sản phẩm', 'Công suất (kW)', 'Giá (VND)', 'Thương hiệu', 'Bảo hành (năm)'],
        ['INV-5-1', 'Inverter hybrid 5kW', 5, 25000000, 'SolarEdge', 12],
        ['INV-8-1', 'Inverter hybrid 8kW', 8, 35000000, 'Fronius', 10],
        ['INV-10-1', 'Inverter hybrid 10kW', 10, 45000000, 'Huawei', 10],
        ['INV-3-2', 'Inverter string 3kW', 3, 15000000, 'SMA', 10],
        ['INV-6-2', 'Inverter string 6kW', 6, 22000000, 'ABB', 10],
        ['INV-15-1', 'Inverter hybrid 15kW', 15, 65000000, 'GoodWe', 10]
    ];

    // Dữ liệu phụ kiện
    const accessoryData = [
        ['Mã phụ kiện', 'Tên sản phẩm', 'Đơn vị', 'Giá (VND)', 'Ghi chú'],
        ['ACC-MOUNT-1', 'Giá đỡ tấm pin mái ngói', 'bộ', 500000, 'Cho 1 tấm pin'],
        ['ACC-MOUNT-2', 'Giá đỡ tấm pin mái tôn', 'bộ', 400000, 'Cho 1 tấm pin'],
        ['ACC-CABLE-1', 'Cáp DC 4mm2', 'mét', 15000, 'Cáp nối tấm pin'],
        ['ACC-CABLE-2', 'Cáp AC 6mm2', 'mét', 25000, 'Cáp AC'],
        ['ACC-BREAKER-1', 'Cầu dao tự động DC', 'chiếc', 800000, '63A'],
        ['ACC-BREAKER-2', 'Cầu dao tự động AC', 'chiếc', 600000, '32A'],
        ['ACC-METER-1', 'Đồng hồ đo 2 chiều', 'chiếc', 3500000, 'Đồng hồ EVN'],
        ['ACC-INSTALL-1', 'Chi phí lắp đặt', 'kW', 2000000, 'Theo công suất hệ thống']
    ];

    // Tạo workbook
    const wb = XLSX.utils.book_new();
    
    // Tạo worksheets
    const wsPV = XLSX.utils.aoa_to_sheet(pvData);
    const wsBattery = XLSX.utils.aoa_to_sheet(batteryData);
    const wsInverter = XLSX.utils.aoa_to_sheet(inverterData);
    const wsAccessory = XLSX.utils.aoa_to_sheet(accessoryData);
    
    // Thêm worksheets vào workbook
    XLSX.utils.book_append_sheet(wb, wsPV, 'PV_Panels');
    XLSX.utils.book_append_sheet(wb, wsBattery, 'Batteries');
    XLSX.utils.book_append_sheet(wb, wsInverter, 'Inverters');
    XLSX.utils.book_append_sheet(wb, wsAccessory, 'Accessories');
    
    // Lưu file
    const filePath = path.join(__dirname, '../../data/solar_database.xlsx');
    XLSX.writeFile(wb, filePath);
    
    console.log('Đã tạo file Excel mẫu tại:', filePath);
    return filePath;
}

module.exports = { createSampleExcel };