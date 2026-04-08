//auth.js is a controller file which is responsible for handling the login, register, logout and checking if the user is logged in or not.
const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();



router.post('/register' , authController.register);

router.post('/login' , authController.login);

router.get('/logout' , authController.logout)


module.exports = router ;