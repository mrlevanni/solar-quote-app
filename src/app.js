const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const DataReader = require('./utils/dataReader');
const SolarCalculator = require('./utils/calculator');
const PDFGenerator = require('./utils/pdfGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer config cho upload files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'data/');
    },
    filename: (req, file, cb) => {
        cb(null, 'uploaded_' + Date.now() + '.xlsx');
    }
});
const upload = multer({ storage });

// Initialize data reader, calculator, và PDF generator
const dataReader = new DataReader();
const calculator = new SolarCalculator(dataReader);
const pdfGenerator = new PDFGenerator();

// Load initial data
dataReader.loadExcelData();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API để lấy dữ liệu thiết bị
app.get('/api/equipment', (req, res) => {
    const data = dataReader.getData();
    if (!data) {
        return res.status(500).json({ error: 'Không thể đọc dữ liệu thiết bị' });
    }
    res.json(data);
});

// API tính toán báo giá
app.post('/api/calculate-quote', (req, res) => {
    try {
        const customerData = req.body;
        
        // Validate input
        if (!customerData.customerName || !customerData.monthlyBill) {
            return res.status(400).json({ error: 'Thiếu thông tin khách hàng' });
        }
        
        const result = calculator.calculateSystem(customerData);
        res.json(result);
    } catch (error) {
        console.error('Lỗi tính toán:', error);
        res.status(500).json({ error: 'Lỗi trong quá trình tính toán' });
    }
});

// API tùy chỉnh báo giá
app.post('/api/customize-quote', (req, res) => {
    try {
        const { customConfig } = req.body;
        
        // Tính toán lại với config tùy chỉnh
        const quote = calculator.generateQuote(customConfig);
        res.json({ quote });
    } catch (error) {
        console.error('Lỗi tùy chỉnh báo giá:', error);
        res.status(500).json({ error: 'Lỗi trong quá trình tùy chỉnh' });
    }
});

// API upload Excel database
app.post('/api/upload-database', upload.single('database'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Không có file được upload' });
        }
        
        // Update dataReader to use new file
        dataReader.excelPath = req.file.path;
        const success = dataReader.loadExcelData();
        
        if (success) {
            res.json({ message: 'Upload database thành công', file: req.file.filename });
        } else {
            res.status(500).json({ error: 'Không thể đọc file Excel' });
        }
    } catch (error) {
        console.error('Lỗi upload:', error);
        res.status(500).json({ error: 'Lỗi trong quá trình upload' });
    }
});

// API tạo PDF
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { quoteData, companyInfo } = req.body;
        
        if (!quoteData) {
            return res.status(400).json({ error: 'Thiếu dữ liệu báo giá' });
        }
        
        // Logo is already in proper format from client
        // No additional processing needed
        
        const pdfBuffer = await pdfGenerator.generateQuotePDF(quoteData, companyInfo || {});
        
        // Set headers for PDF download
        const safeFileName = `BaoGia_${quoteData.customer.name.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const encodedFileName = encodeURIComponent(safeFileName);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
        
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Lỗi tạo PDF:', error);
        res.status(500).json({ error: 'Lỗi trong quá trình tạo PDF: ' + error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Có lỗi xảy ra trên server' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📊 Đã load dữ liệu thiết bị thành công`);
});