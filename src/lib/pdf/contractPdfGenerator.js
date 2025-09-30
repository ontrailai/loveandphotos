/**
 * Contract PDF Generator using Puppeteer
 * Generates signed contract PDFs for storage and photographer access
 */

import puppeteer from 'puppeteer'
import { getContractText } from '../contract/contractVersion.js'

/**
 * Generate HTML for the signed contract
 * @param {Object} contractData - Contract data including signature
 * @returns {string} HTML string for PDF generation
 */
function generateContractHTML(contractData) {
  const {
    contractVersion,
    eventDate,
    location,
    packageName,
    price,
    signerFullName,
    signaturePngBase64,
    signedAt,
    bookingId
  } = contractData

  const contractText = getContractText()
  const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedSignedAt = new Date(signedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signed Contract - Love & Photos</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      padding: 40px 60px;
      max-width: 8.5in;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #fe395f;
    }

    .header h1 {
      font-size: 24pt;
      color: #fe395f;
      margin-bottom: 5px;
    }

    .header .subtitle {
      font-size: 12pt;
      color: #666;
      font-style: italic;
    }

    .contract-info {
      background: #f9f9f9;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #fe395f;
    }

    .contract-info h2 {
      font-size: 14pt;
      color: #fe395f;
      margin-bottom: 15px;
    }

    .contract-info .info-row {
      display: flex;
      margin-bottom: 8px;
    }

    .contract-info .info-label {
      font-weight: bold;
      width: 140px;
      color: #555;
    }

    .contract-info .info-value {
      flex: 1;
    }

    .contract-text {
      margin: 30px 0;
      text-align: justify;
    }

    .contract-text p {
      margin-bottom: 15px;
    }

    .signature-section {
      margin-top: 40px;
      padding: 25px;
      border: 2px solid #ddd;
      border-radius: 8px;
      background: #fafafa;
    }

    .signature-section h3 {
      font-size: 13pt;
      color: #fe395f;
      margin-bottom: 20px;
      text-align: center;
    }

    .signature-box {
      background: white;
      border: 2px solid #333;
      padding: 15px;
      margin: 20px 0;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .signature-box img {
      max-width: 100%;
      max-height: 100px;
      object-fit: contain;
    }

    .signer-info {
      margin-top: 15px;
    }

    .signer-info .info-row {
      display: flex;
      margin-bottom: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .signer-info .label {
      font-weight: bold;
      width: 160px;
      color: #555;
    }

    .signer-info .value {
      flex: 1;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
      text-align: center;
    }

    .footer .contract-id {
      font-family: 'Courier New', monospace;
      background: #f0f0f0;
      padding: 5px 10px;
      margin: 10px 0;
      display: inline-block;
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt;
      color: rgba(254, 57, 95, 0.05);
      z-index: -1;
      white-space: nowrap;
      user-select: none;
      pointer-events: none;
    }

    @media print {
      body {
        padding: 20px 40px;
      }
    }
  </style>
</head>
<body>
  <div class="watermark">SIGNED CONTRACT</div>

  <div class="header">
    <h1>Love & Photos</h1>
    <div class="subtitle">Professional Photography Services Agreement</div>
  </div>

  <div class="contract-info">
    <h2>Contract Details</h2>
    <div class="info-row">
      <span class="info-label">Contract Version:</span>
      <span class="info-value">${contractVersion}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Booking ID:</span>
      <span class="info-value">${bookingId}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Event Date:</span>
      <span class="info-value">${formattedDate}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Event Location:</span>
      <span class="info-value">${location}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Package:</span>
      <span class="info-value">${packageName}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Total Amount:</span>
      <span class="info-value">$${parseFloat(price).toFixed(2)}</span>
    </div>
  </div>

  <div class="contract-text">
    ${contractText.split('\n\n').map(para => `<p>${para}</p>`).join('\n')}
  </div>

  <div class="signature-section">
    <h3>Digital Signature</h3>

    <div class="signature-box">
      <img src="${signaturePngBase64}" alt="Customer Signature" />
    </div>

    <div class="signer-info">
      <div class="info-row">
        <span class="label">Signed by:</span>
        <span class="value">${signerFullName}</span>
      </div>
      <div class="info-row">
        <span class="label">Date & Time:</span>
        <span class="value">${formattedSignedAt}</span>
      </div>
      <div class="info-row">
        <span class="label">Digital Signature:</span>
        <span class="value">I acknowledge that my digital signature has the same legal effect as a handwritten signature.</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="contract-id">Contract ID: ${bookingId}</div>
    <p>This is a legally binding digital contract. Please retain a copy for your records.</p>
    <p>&copy; ${new Date().getFullYear()} Love & Photos. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate PDF buffer from contract data using Puppeteer
 * @param {Object} contractData - Contract data including signature
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateContractPDF(contractData) {
  let browser = null

  try {
    console.log('🖨️ Generating contract PDF for booking:', contractData.bookingId)

    // Launch Puppeteer in headless mode
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // Generate HTML content
    const htmlContent = generateContractHTML(contractData)

    // Set content and wait for images to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    })

    // Generate PDF with specific options
    const pdfBuffer = await page.pdf({
      format: 'Letter', // 8.5 x 11 inches
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: true
    })

    console.log('✅ Contract PDF generated successfully:', {
      bookingId: contractData.bookingId,
      size: `${Math.round(pdfBuffer.length / 1024)}KB`
    })

    return pdfBuffer

  } catch (error) {
    console.error('❌ Failed to generate contract PDF:', error)
    throw {
      message: 'Failed to generate contract PDF',
      code: 'PDF_GENERATION_FAILED',
      status: 500,
      originalError: error.message
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * Upload PDF to Supabase Storage
 * @param {Object} supabase - Supabase client instance
 * @param {Buffer} pdfBuffer - PDF buffer to upload
 * @param {string} bookingId - Booking ID for file naming
 * @returns {Promise<string>} Public URL of uploaded PDF
 */
export async function uploadContractPDF(supabase, pdfBuffer, bookingId) {
  try {
    console.log('📤 Uploading contract PDF to storage for booking:', bookingId)

    const fileName = `booking_${bookingId}.pdf`
    const filePath = fileName

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('signed-contracts')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true // Overwrite if exists
      })

    if (error) {
      console.error('❌ Storage upload error:', error)
      throw {
        message: 'Failed to upload contract PDF to storage',
        code: 'STORAGE_UPLOAD_FAILED',
        status: 500,
        originalError: error.message
      }
    }

    // Get public URL (will be access-controlled by RLS)
    const { data: { publicUrl } } = supabase.storage
      .from('signed-contracts')
      .getPublicUrl(filePath)

    console.log('✅ Contract PDF uploaded successfully:', publicUrl)

    return publicUrl

  } catch (error) {
    console.error('❌ Failed to upload contract PDF:', error)
    throw error
  }
}

/**
 * Update booking record with signed contract URL
 * @param {Object} supabase - Supabase client instance
 * @param {string} bookingId - Booking ID
 * @param {string} contractUrl - URL of signed contract PDF
 * @returns {Promise<void>}
 */
export async function updateBookingWithContractUrl(supabase, bookingId, contractUrl) {
  try {
    console.log('💾 Updating booking with contract URL:', bookingId)

    const { error } = await supabase
      .from('bookings')
      .update({
        contract_signed_url: contractUrl,
        contract_signed_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('❌ Failed to update booking with contract URL:', error)
      throw {
        message: 'Failed to update booking record',
        code: 'BOOKING_UPDATE_FAILED',
        status: 500,
        originalError: error.message
      }
    }

    console.log('✅ Booking updated with contract URL')

  } catch (error) {
    console.error('❌ Failed to update booking:', error)
    throw error
  }
}