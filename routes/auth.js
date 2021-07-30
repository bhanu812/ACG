const express = require('express');


const {
    register,
    login,
    // logout,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
    getAllusers
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.get('/login', login);
router.get('/me', protect, getMe);
router.get('/all', protect, getAllusers);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotPassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);



module.exports = router;