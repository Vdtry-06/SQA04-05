const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const { testConnection } = require('./models'); // models/index.js must export testConnection
const authRoutes = require('./routes/authRoute');
const userRoutes = require('./routes/usersRoute');
const productRoutes = require('./routes/productsRoute');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/ordersRoute');
const shipmentRoutes = require('./routes/shipmentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const chatRoutes = require('./routes/chatRoute');
const reportRoutes = require('./routes/reportsRoute');
const supplierRoutes = require('./routes/supplierRoutes');

const reviewRoutes = require('./routes/reviewRoutes');
const blogRoutes = require('./routes/blogRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentsRoute');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static files (optional)
app.use('/public', express.static(path.join(__dirname, 'public')));

// mount routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);

app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/contact', contactRoutes);

// health
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/', (req, res) => res.send('API running...'));

// error handler if exists
try {
  const errorHandler = require('./middlewares/errorHandler');
  app.use(errorHandler);
} catch (err) {
  // no custom error handler; continue
  // eslint-disable-next-line no-console
  console.warn('No errorHandler middleware found at ./middlewares/errorHandler.js');
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Server running on http://localhost:${PORT} (base API: /api)`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

// only start if run directly
if (require.main === module) {
  startServer();
}

module.exports = app;