const { extractReceiptData } = require('../utils/receiptParser');

const parseOcrResponseText = (result) => {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (result?.ParsedResults?.length) {
    return result.ParsedResults.map((r) => r.ParsedText).join('\n');
  }
  return '';
};

const scanReceipt = async (req, res, next) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Receipt image is required',
      });
    }

    const apiKey = process.env.OCR_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'Receipt scanning is not configured. Please contact support.',
      });
    }

    if (typeof FormData === 'undefined') {
      return res.status(500).json({
        success: false,
        message: 'Receipt scanning is not supported on this server runtime.',
      });
    }

    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('base64Image', imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData,
    });

    if (!ocrResponse.ok) {
      return res.status(502).json({
        success: false,
        message: 'Unable to scan receipt. Please try a clearer photo.',
      });
    }

    const ocrResult = await ocrResponse.json();

    if (ocrResult?.IsErroredOnProcessing || ocrResult?.ErrorMessage) {
      return res.status(422).json({
        success: false,
        message: 'Unable to scan receipt. Please try a clearer photo.',
      });
    }

    const text = parseOcrResponseText(ocrResult);

    if (!text) {
      return res.status(422).json({
        success: false,
        message: 'Unable to extract text from this receipt. Please try a different photo.',
      });
    }

    const data = extractReceiptData(text);

    res.json({
      success: true,
      data: {
        rawText: text,
        ...data,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { scanReceipt };
