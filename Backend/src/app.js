const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const routeRoutes = require('./routes/routeRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

const parseCorsOrigins = () => {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return [];
  return raw
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const allowlist = parseCorsOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowlist.length) return callback(null, true);
      if (allowlist.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/routes', routeRoutes);

app.use(errorHandler);

module.exports = app;
