const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = Number(err?.status || err?.statusCode || 500);
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'Server error' : err.message || 'Server error';
  res.status(status).json({ message });
};

module.exports = errorHandler;
