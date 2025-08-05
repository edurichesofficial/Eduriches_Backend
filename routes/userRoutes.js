const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.createUser);
router.get('/login', userController.loginUser);
router.post('/Change-password', userController.otpGeneration);
router.post('/verifyOtp', userController.verifyOtp);
router.post('/resetPassword', userController.resetPassword);


module.exports = router;