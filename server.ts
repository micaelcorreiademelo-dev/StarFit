import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Explicitly serve a valid sw.js in development or fallback to prevent HTML MIME type errors
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    
    // In production, attempt to serve the built Service Worker file
    const distSwPath = path.join(__dirname, 'dist', 'sw.js');
    if (fs.existsSync(distSwPath)) {
      return res.sendFile(distSwPath);
    }
    
    // Otherwise (or in development/fallback), serve a standard, robust Service Worker
    res.send(`/* StarFit PWA Dev SW Fallback */
const CACHE_NAME = 'starfit-dev-cache-v1';
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('StarFit PWA Dev SW: Installed successfully.');
});
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
  console.log('StarFit PWA Dev SW: Activated and Claimed Clients successfully.');
});
self.addEventListener('fetch', (event) => {
  // Simple dev bypass: fetch from network, fallback to cache if available
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});`);
  });

  // Initialize Firebase for the Server proxy
  let storage: any = null;
  try {
    const configPath = path.join(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configObj = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const firebaseApp = initializeApp(configObj, 'server-app');
      storage = getStorage(firebaseApp);
    }
  } catch (error) {
    console.error("Firebase Storage init error in server:", error);
  }

  // Configure Multer
  const upload = multer({ storage: multer.memoryStorage() });

  // Upload Proxy Endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }
      if (!storage) {
        return res.status(500).json({ error: 'Storage não configurado.' });
      }

      const file = req.file;
      const folder = req.body.folder || 'uploads';
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const extension = file.originalname?.split('.').pop() || 'tmp';
      const filePath = `${folder}/${timestamp}-${uniqueId}.${extension}`;

      const storageRef = ref(storage, filePath);
      
      const metadata = {
        contentType: file.mimetype,
      };

      const snapshot = await uploadBytes(storageRef, file.buffer, metadata);
      const url = await getDownloadURL(snapshot.ref);

      res.json({ url, path: filePath });
    } catch (error: any) {
      console.error('Server Upload Error:', error);
      res.status(500).json({ error: error.message || 'Erro interno no upload' });
    }
  });

  // API Route: Create Mercado Pago Preference
  app.post('/api/payments/create-preference', async (req, res) => {

    try {
      const { trainerAccessToken, studentEmail, planName, price, studentId, trainerId } = req.body;

      if (!trainerAccessToken) {
        return res.status(400).json({ error: 'Trainer has not configured Mercado Pago' });
      }

      const client = new MercadoPagoConfig({ accessToken: trainerAccessToken });
      const preference = new Preference(client);

      const response = await preference.create({
        body: {
          items: [
            {
              id: 'plan-' + Math.random().toString(36).substring(7),
              title: `Plano ${planName} - StarFit`,
              unit_price: Number(price),
              quantity: 1,
              currency_id: 'BRL',
            }
          ],
          payer: {
            email: studentEmail,
          },
          back_urls: {
            success: `${req.headers.origin}/payment-success`,
            failure: `${req.headers.origin}/payment-failure`,
            pending: `${req.headers.origin}/payment-pending`,
          },
          auto_return: 'approved',
          external_reference: JSON.stringify({ studentId, trainerId, planName }),
          // Notification URL could be set here for webhooks
        }
      });

      res.json({ init_point: response.init_point });
    } catch (error: any) {
      console.error('Mercado Pago Error:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
