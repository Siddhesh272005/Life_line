const express = require('express');
const {
  createRequest,
  listRequests,
  listMyRequests,
  listMyDonations,
  getRequest,
  updateRequest,
  deleteRequest,
  respondToRequest,
  markDonation,
} = require('../controllers/requestController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, listRequests);
router.post('/', auth, createRequest);
router.get('/mine', auth, listMyRequests);
router.get('/my-donations', auth, listMyDonations);
router.get('/:id', auth, getRequest);
router.put('/:id', auth, updateRequest);
router.delete('/:id', auth, deleteRequest);
router.post('/:id/respond', auth, respondToRequest);
router.post('/:id/donate', auth, markDonation);

module.exports = router;
