import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { logger } from './logger';
import { handleIncomingMessage } from './handler';

const SESSION_DIR = '.auth_info_baileys';
let currentSocket: WASocket | null = null;
let connectionState: 'connecting' | 'open' | 'close' | 'qr' = 'close';

/**
 * Returns the current connection status metadata for the status API.
 */
export function getWhatsAppClientStatus() {
  return {
    state: connectionState,
    sessionDirectory: SESSION_DIR,
  };
}

/**
 * Starts the persistent WhatsApp client connection.
 */
export async function startWhatsAppClient(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  logger.info('[WA Client] Initializing Baileys connection socket...');
  connectionState = 'connecting';

  // Create the Baileys socket connection
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // We will manually generate the QR code to handle formatting
    logger: logger as any,
  });

  currentSocket = sock;

  // Handle connection updates (QR code generation, connection opened/closed)
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      connectionState = 'qr';
      logger.info('\n--- SCAN THIS QR CODE WITH WHATSAPP TO CONNECT BOT ---');
      qrcode.generate(qr, { small: true });
      logger.info('------------------------------------------------------\n');
    }

    if (connection === 'close') {
      connectionState = 'close';
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn(`[WA Client] Connection closed: ${lastDisconnect?.error?.message} (Code: ${statusCode}). Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        logger.info('[WA Client] Retrying connection in 5 seconds...');
        setTimeout(startWhatsAppClient, 5000);
      } else {
        logger.error('[WA Client] Session logged out. Delete .auth_info_baileys directory and restart to scan a new QR code.');
      }
    } else if (connection === 'open') {
      connectionState = 'open';
      logger.info('[WA Client] WhatsApp Bot is successfully connected and listening for messages!');
    }
  });

  // Save auth credentials whenever they update
  sock.ev.on('creds.update', saveCreds);

  // Bind message listener
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        try {
          await handleIncomingMessage(sock, msg);
        } catch (err) {
          logger.error(err, '[WA Client] Error handling message');
        }
      }
    }
  });

  return sock;
}
