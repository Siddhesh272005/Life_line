const dotenv = require('dotenv');
const os = require('os');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initFirebaseAdmin } = require('./config/firebase');

dotenv.config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const getLanIps = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];

  Object.values(interfaces).forEach((list) => {
    (list || []).forEach((item) => {
      if (item.family === 'IPv4' && !item.internal) {
        ips.push(item.address);
      }
    });
  });

  return ips;
};

const start = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    initFirebaseAdmin();

    app.listen(PORT, HOST, () => {
      const lanIps = getLanIps();
      console.log(`Backend running on http://${HOST}:${PORT}`);
      console.log(`Local URL: http://127.0.0.1:${PORT}`);
      lanIps.forEach((ip) => {
        console.log(`LAN URL: http://${ip}:${PORT}`);
      });
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
};

start();
