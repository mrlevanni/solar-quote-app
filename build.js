const fs = require('fs');
const path = require('path');

// API endpoints
const apiEndpoints = [
  'equipment',
  'calculate-quote',
  'customize-quote',
  'upload-database',
  'generate-pdf'
];

// Generate Cloudflare Pages Functions with full logic
function buildFunctions() {
  console.log('🚀 Generating full Cloudflare Pages Functions...');

  const apiDir = path.join(__dirname, 'functions', 'api');
  fs.mkdirSync(apiDir, { recursive: true });

  apiEndpoints.forEach(endpoint => {
    const functionPath = path.join(apiDir, `${endpoint}.js`);

    const functionContent = `
import { DataReader } from '../../../src/utils/dataReader.js';
import { SolarCalculator } from '../../../src/utils/calculator.js';
import { PDFGenerator } from '../../../src/utils/pdfGenerator.js';

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();

    const dataReader = new DataReader();
    const calculator = new SolarCalculator(dataReader);
    const pdfGenerator = new PDFGenerator();

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
            'Content-Disposition': `attachment; filename=\"BaoGia_${body.quoteData.customer.name.replace(/\s+/g, '_')}_${Date.now()}.pdf\"`
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
}`;

    fs.writeFileSync(functionPath, functionContent.trim());
  });

  console.log('✅ Full logic API functions created in /functions/api');
}

// Copy essential data only
function copyDataToPublic() {
  const dataDir = path.join(__dirname, 'data');
  const publicDataDir = path.join(__dirname, 'public', 'data');

  if (!fs.existsSync(dataDir)) return;

  fs.mkdirSync(publicDataDir, { recursive: true });

  fs.readdirSync(dataDir).forEach(file => {
    if (file.endsWith('.json') || file.endsWith('.xlsx')) {
      fs.copyFileSync(
        path.join(dataDir, file),
        path.join(publicDataDir, file)
      );
    }
  });

  console.log('✅ Copied data to /public/data');
}

if (require.main === module) {
  copyDataToPublic();
  buildFunctions();
}
