const express = require('express');
const multer = require('multer');
const {
  uploadCertificate,
  listMyCertificates,
  listIssuedCertificates,
  downloadCertificate,
} = require('../controllers/certificateController');
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', auth, role('hospital', 'ngo'), upload.single('file'), uploadCertificate);
router.get('/my', auth, role('civilian'), listMyCertificates);
router.get('/issued', auth, role('hospital', 'ngo'), listIssuedCertificates);
router.get('/:id/download', auth, downloadCertificate);

module.exports = router;
