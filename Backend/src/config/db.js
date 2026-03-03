const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket = null;

const connectDB = async (uri) => {
  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }
  const isProd = process.env.NODE_ENV === 'production';
  await mongoose.connect(uri, {
    autoIndex: !isProd,
  });
  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'certificates',
  });
};

const getBucket = () => {
  if (!bucket) {
    throw new Error('GridFS bucket not initialized');
  }
  return bucket;
};

module.exports = { connectDB, getBucket };
