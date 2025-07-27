const fs = require('fs');
const path = require('path');

// Build script for Cloudflare Pages
function buildForCloudflarePages() {
    console.log('🚀 Building for Cloudflare Pages...');
    
    // Create functions directory for Cloudflare Pages
    const functionsDir = path.join(__dirname, 'functions');
    if (!fs.existsSync(functionsDir)) {
        fs.mkdirSync(functionsDir, { recursive: true });
    }
    
    // Create API endpoints as Cloudflare Functions
    const apiEndpoints = [
        'equipment',
        'calculate-quote',
        'customize-quote',
        'upload-database',
        'generate-pdf'
    ];
    
    apiEndpoints.forEach(endpoint => {
        const functionContent = `
const { DataReader } = require('../src/utils/dataReader');
const { SolarCalculator } = require('../src/utils/calculator');
const { PDFGenerator } = require('../src/utils/pdfGenerator');

export async function onRequestPost(context) {
    const { request } = context;
    
    try {
        const body = await request.json();
        
        // Initialize services
        const dataReader = new DataReader();
        const calculator = new SolarCalculator(dataReader);
        const pdfGenerator = new PDFGenerator();
        
        // Load data
        dataReader.loadExcelData();
        
        let result;
        
        switch ('${endpoint}') {
            case 'equipment':
                result = dataReader.getData();
                break;
                
            case 'calculate-quote':
                result = calculator.calculateSystem(body);
                break;
                
            case 'customize-quote':
                result = { quote: calculator.generateQuote(body.customConfig) };
                break;
                
            case 'generate-pdf':
                const pdfBuffer = await pdfGenerator.generateQuotePDF(body.quoteData, body.companyInfo);
                return new Response(pdfBuffer, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': \`attachment; filename="BaoGia_\${body.quoteData.customer.name.replace(/\\s+/g, '_')}_\${Date.now()}.pdf"\`
                    }
                });
                
            default:
                throw new Error('Unknown endpoint');
        }
        
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Error in ${endpoint}:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    if ('${endpoint}' === 'equipment') {
        return onRequestPost(context);
    }
    return new Response('Method not allowed', { status: 405 });
}
        `;
        
        fs.writeFileSync(
            path.join(functionsDir, `api`, `${endpoint}.js`),
            functionContent.trim()
        );
    });
    
    // Create directory structure for functions
    const apiFunctionsDir = path.join(functionsDir, 'api');
    if (!fs.existsSync(apiFunctionsDir)) {
        fs.mkdirSync(apiFunctionsDir, { recursive: true });
    }
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Functions created in:', functionsDir);
}

// Copy necessary files to public directory
function copyFilesToPublic() {
    const publicDir = path.join(__dirname, 'public');
    const srcDir = path.join(__dirname, 'src');
    const dataDir = path.join(__dirname, 'data');
    
    // Copy data files
    if (fs.existsSync(dataDir)) {
        const publicDataDir = path.join(publicDir, 'data');
        if (!fs.existsSync(publicDataDir)) {
            fs.mkdirSync(publicDataDir, { recursive: true });
        }
        
        fs.readdirSync(dataDir).forEach(file => {
            fs.copyFileSync(
                path.join(dataDir, file),
                path.join(publicDataDir, file)
            );
        });
    }
    
    // Copy utils to public for client-side access
    const publicUtilsDir = path.join(publicDir, 'utils');
    if (!fs.existsSync(publicUtilsDir)) {
        fs.mkdirSync(publicUtilsDir, { recursive: true });
    }
    
    const utilsDir = path.join(srcDir, 'utils');
    if (fs.existsSync(utilsDir)) {
        fs.readdirSync(utilsDir).forEach(file => {
            if (file.endsWith('.js')) {
                fs.copyFileSync(
                    path.join(utilsDir, file),
                    path.join(publicUtilsDir, file)
                );
            }
        });
    }
}

// Main build process
if (require.main === module) {
    copyFilesToPublic();
    buildForCloudflarePages();
}

module.exports = { buildForCloudflarePages, copyFilesToPublic };