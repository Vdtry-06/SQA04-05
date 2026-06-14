// Global error handler to ensure JSON responses for unexpected errors
// Usage: app.use(require('./middlewares/errorHandler')) after routes

module.exports = function errorHandler(err, req, res, next) {
  // Log full error on server
  // eslint-disable-next-line no-console
  console.error('Global error handler:', err && err.stack ? err.stack : err);

  // Do not leak internals in production
  const isDev = process.env.NODE_ENV !== 'production';
  const status = err && err.status && Number.isInteger(err.status) ? err.status : 500;
  const payload = {
    success: false,
    message: err && err.message ? err.message : 'Lỗi máy chủ',
  };
  if (isDev) {
    payload.error = String(err);
  }

  res.status(status).json(payload);
};

