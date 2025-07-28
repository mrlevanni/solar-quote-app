const XLSX = require('xlsx');
const path = require('path');

class DataReader {
    constructor() {
        this.data = null;
        this.excelPath = path.join(__dirname, '../../data/solar_database.xlsx');
    }

    loadExcelData() {
        try {
            const workbook = XLSX.readFile(this.excelPath);
            
            this.data = {
                pvPanels: this.parseSheet(workbook, 'PV_Panels', ['Mã PV', 'Tên sản phẩm', 'Công suất (W)', 'Giá (VND)', 'Thương hiệu', 'Bảo hành (năm)']),
                batteries: this.parseSheet(workbook, 'Batteries', ['Mã Pin', 'Tên sản phẩm', 'Dung lượng (kWh)', 'Giá (VND)', 'Thương hiệu', 'Bảo hành (năm)']),
                inverters: this.parseSheet(workbook, 'Inverters', ['Mã Inverter', 'Tên sản phẩm', 'Công suất (kW)', 'Giá (VND)', 'Thương hiệu', 'Bảo hành (năm)']),
                accessories: this.parseSheet(workbook, 'Accessories', ['Mã phụ kiện', 'Tên sản phẩm', 'Đơn vị', 'Giá (VND)', 'Ghi chú'])
            };
            
            console.log('Đã load dữ liệu Excel thành công');
            return this.data;
        } catch (error) {
            console.error('Lỗi khi đọc file Excel:', error.message);
            return null;
        }
    }

    parseSheet(workbook, sheetName, headers) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            console.warn(`Sheet ${sheetName} không tồn tại`);
            return [];
        }

        const jsonData = XLSX.utils.sheet_to_json(sheet);
        return jsonData.map(row => {
            const item = {};
            headers.forEach((header, index) => {
                const key = this.getKeyFromHeader(header);
                item[key] = row[header] || '';
            });
            return item;
        });
    }

    getKeyFromHeader(header) {
        const keyMap = {
            'Mã PV': 'code',
            'Mã Pin': 'code',
            'Mã Inverter': 'code',
            'Mã phụ kiện': 'code',
            'Tên sản phẩm': 'name',
            'Công suất (W)': 'powerW',
            'Công suất (kW)': 'powerKW',
            'Dung lượng (kWh)': 'capacity',
            'Giá (VND)': 'price',
            'Thương hiệu': 'brand',
            'Bảo hành (năm)': 'warranty',
            'Đơn vị': 'unit',
            'Ghi chú': 'note'
        };
        return keyMap[header] || header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    }

    getData() {
        if (!this.data) {
            this.loadExcelData();
        }
        return this.data;
    }

    getPVPanels() {
        const data = this.getData();
        return data ? data.pvPanels : [];
    }

    getBatteries() {
        const data = this.getData();
        return data ? data.batteries : [];
    }

    getInverters() {
        const data = this.getData();
        return data ? data.inverters : [];
    }

    getAccessories() {
        const data = this.getData();
        return data ? data.accessories : [];
    }

    findItemByCode(type, code) {
        const data = this.getData();
        if (!data) return null;

        const items = data[type] || [];
        return items.find(item => item.code === code);
    }
}

module.exports = DataReader;