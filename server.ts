import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
