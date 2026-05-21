import { startWhatsAppClient } from '../lib/whatsapp/client';
import { logger } from '../lib/whatsapp/logger';

// Self-executing boot script for the background WhatsApp daemon
(async () => {
  try {
    logger.info('[Runner] Initializing VERIX WhatsApp Bot daemon...');
    await startWhatsAppClient();
  } catch (error) {
    logger.error(error, '[Runner] Fatal error starting VERIX WhatsApp Bot daemon');
    process.exit(1);
  }
})();
