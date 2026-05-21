import { WASocket, proto } from '@whiskeysockets/baileys';
import { getMessageText, getMessageImage, extractUrls } from './parser';
import { isRateLimited, getRemainingSeconds } from './rateLimiter';
import { humanDelay } from './antiAbuse';
import { getContext, setContext, clearContext } from './memory';
import {
  formatScanResult,
  formatHelpMessage,
  formatReportScamMessage,
  formatRateLimitMessage,
  formatErrorMessage
} from './formatter';
import { logger } from './logger';

const ANALYZE_API_URL = process.env.ANALYZE_API_URL || 'http://localhost:3000/api/analyze';

type Intent = 'SCAN_URL' | 'ASK_HELP' | 'REPORT_SCAM' | 'UNKNOWN';

/**
 * Handles incoming WhatsApp messages from Baileys client socket.
 */
export async function handleIncomingMessage(sock: WASocket, msg: proto.IWebMessageInfo) {
  if (!msg.key || !msg.key.remoteJid) return;
  const jid = msg.key.remoteJid;

  // Filter: Ignore group messages to keep direct messages focused
  if (jid.endsWith('@g.us')) {
    return;
  }

  // Filter: Ignore WhatsApp status broadcasts
  if (jid === 'status@broadcast') {
    return;
  }

  // Filter: Ignore messages sent by the bot itself
  if (msg.key.fromMe) {
    return;
  }

  // Get message text and image attachment if any
  const text = getMessageText(msg);
  const image = await getMessageImage(msg);

  // If both are empty (e.g. sticker, location, document), ignore the message
  if (!text.trim() && !image) {
    return;
  }

  logger.info(`[WA Handler] Message from ${jid}: TextLength=${text.length}, HasImage=${!!image}`);

  // 1. Rate Limiting
  if (isRateLimited(jid)) {
    logger.warn(`[WA Handler] Rate limit triggered for ${jid}`);
    const remaining = getRemainingSeconds(jid);
    
    // Simulate composing to look organic even for rate limit warning
    await sock.sendPresenceUpdate('composing', jid);
    await humanDelay();
    await sock.sendPresenceUpdate('paused', jid);
    
    await sock.sendMessage(jid, { text: formatRateLimitMessage(remaining) }, { quoted: msg as any });
    return;
  }

  // Update conversation memory with new inputs
  if (image) {
    setContext(jid, { lastImage: image });
  }

  const urls = extractUrls(text);
  if (urls.length > 0) {
    setContext(jid, { lastUrl: urls[0] });
  }

  const context = getContext(jid);
  const hasUrls = urls.length > 0;
  const hasContext = !!context?.lastImage || !!context?.lastUrl;

  // 2. Classify Message Intent
  const intent = classifyIntent(text, hasUrls, hasContext);
  logger.info(`[WA Handler] Intent for ${jid} classified as: ${intent}`);

  try {
    // Simulate human typing presence
    await sock.sendPresenceUpdate('composing', jid);

    if (intent === 'ASK_HELP') {
      await humanDelay();
      await sock.sendPresenceUpdate('paused', jid);
      await sock.sendMessage(jid, { text: formatHelpMessage() }, { quoted: msg as any });
      return;
    }

    if (intent === 'REPORT_SCAM') {
      await humanDelay();
      await sock.sendPresenceUpdate('paused', jid);
      
      // Clear memory context on manual reports
      clearContext(jid);
      
      await sock.sendMessage(jid, { text: formatReportScamMessage() }, { quoted: msg as any });
      return;
    }

    if (intent === 'SCAN_URL') {
      // Determine active values using direct inputs or conversational context memory
      const activeImage = image || context?.lastImage;
      const activeUrl = urls[0] || context?.lastUrl;
      const activeText = text;

      const payload: any = {
        text: activeText || (activeUrl ? `Scan URL: ${activeUrl}` : 'Scan payload'),
      };

      if (activeImage) {
        payload.image = {
          inlineData: {
            data: activeImage.data,
            mimeType: activeImage.mimeType,
          },
        };
      }

      logger.info(`[WA Handler] Dispatching scan to VERIX API: URL="${activeUrl || 'None'}", HasImage=${!!payload.image}`);

      // Query threat engine API
      const response = await fetch(ANALYZE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`VERIX API returned status code: ${response.status}`);
      }

      const scanResult = await response.json();
      const replyText = formatScanResult(scanResult, activeUrl);

      // Organic human delay before responding
      await humanDelay();
      await sock.sendPresenceUpdate('paused', jid);
      await sock.sendMessage(jid, { text: replyText }, { quoted: msg as any });
      return;
    }

    // Default Unknown fallback
    await humanDelay();
    await sock.sendPresenceUpdate('paused', jid);
    await sock.sendMessage(
      jid,
      { text: `Maaf, saya tidak mengenali perintah tersebut.\n\n${formatHelpMessage()}` },
      { quoted: msg as any }
    );

  } catch (error) {
    logger.error(error, `[WA Handler] Failure handling message from ${jid}`);
    await humanDelay();
    await sock.sendPresenceUpdate('paused', jid);
    await sock.sendMessage(jid, { text: formatErrorMessage() }, { quoted: msg as any });
  }
}

/**
 * Classifies the intent of a WhatsApp message.
 */
function classifyIntent(text: string, hasUrls: boolean, hasContext: boolean): Intent {
  const normalizedText = text.toLowerCase().trim();

  // Trigger SCAN if direct URL is found or if user references a context link/image with queries
  if (
    hasUrls ||
    (hasContext &&
      (normalizedText.includes('aman') ||
        normalizedText.includes('cek') ||
        normalizedText.includes('periksa') ||
        normalizedText.includes('scan') ||
        normalizedText.includes('review') ||
        normalizedText.includes('gimana') ||
        normalizedText.includes('link') ||
        normalizedText.includes('apa') ||
        normalizedText.includes('ini')))
  ) {
    return 'SCAN_URL';
  }

  // Trigger SCAN if user uploads an image with no text caption
  if (!text.trim() && hasContext) {
    return 'SCAN_URL';
  }

  const helpKeywords = ['help', 'bantuan', 'panduan', 'cara pakai', 'tutorial', 'fitur', 'cara menggunakan', 'info'];
  if (helpKeywords.some(keyword => normalizedText.includes(keyword))) {
    return 'ASK_HELP';
  }

  const scamKeywords = ['lapor', 'laporkan', 'penipuan', 'kena tipu', 'tertipu', 'scam', 'phishing', 'hacker'];
  if (scamKeywords.some(keyword => normalizedText.includes(keyword))) {
    return 'REPORT_SCAM';
  }

  return 'UNKNOWN';
}
