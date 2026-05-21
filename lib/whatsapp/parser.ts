import { proto, downloadMediaMessage } from '@whiskeysockets/baileys';
import { logger } from './logger';

/**
 * Extracts the main text content from a WhatsApp message object.
 */
export function getMessageText(msg: proto.IWebMessageInfo): string {
  if (!msg.message) return '';

  const messageContent = msg.message;
  
  // Extract text from standard message types
  if (messageContent.conversation) {
    return messageContent.conversation;
  }
  if (messageContent.extendedTextMessage) {
    return messageContent.extendedTextMessage.text || '';
  }
  if (messageContent.imageMessage) {
    return messageContent.imageMessage.caption || '';
  }
  if (messageContent.videoMessage) {
    return messageContent.videoMessage.caption || '';
  }
  if (messageContent.buttonsResponseMessage) {
    return messageContent.buttonsResponseMessage.selectedButtonId || '';
  }
  if (messageContent.templateButtonReplyMessage) {
    return messageContent.templateButtonReplyMessage.selectedId || '';
  }
  if (messageContent.listResponseMessage) {
    return messageContent.listResponseMessage.singleSelectReply?.selectedRowId || '';
  }

  return '';
}

/**
 * Extracts and cleans URLs from a given text.
 */
export function extractUrls(text: string): string[] {
  // Regex matches http/https URLs or bare domains (e.g. bit.ly/xxx, s.id/xxx)
  const urlRegex = /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9-]+\.)+(?:com|id|net|org|xyz|info|top|site|online|ga|cf|gq|ml|tk|me|co|us|cc|tv|link|click|apk)(?:\/[^\s]*)?)/gi;
  const matches = text.match(urlRegex) || [];

  return matches.map(url => {
    let cleanUrl = url.replace(/[.,;)]+$/, ''); // Remove trailing punctuation
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `http://${cleanUrl}`;
    }
    return cleanUrl;
  });
}

/**
 * Downloads and converts an attached image from a WhatsApp message into a base64 inlineData object.
 */
export async function getMessageImage(
  msg: proto.IWebMessageInfo
): Promise<{ data: string; mimeType: string } | null> {
  if (!msg.message || !msg.message.imageMessage) {
    return null;
  }

  try {
    const mimeType = msg.message.imageMessage.mimetype || 'image/jpeg';
    
    // Download decrypted media buffer
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger,
        reuploadRequest: async () => ({})
      }
    );

    if (Buffer.isBuffer(buffer)) {
      return {
        data: buffer.toString('base64'),
        mimeType
      };
    }
  } catch (error) {
    logger.error('Failed to download image from WhatsApp message:', error);
  }

  return null;
}
