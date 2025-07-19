const express = require('express');
const router = express.Router();

//User login
router.post('/login', (req,res) => {
    res.send('POST Login');
});

//User registration  
router.post('/signup',(req,res) =>{
    res.send('post signup');
});

//User logout
router.post('/logout', (req,res) => {
    res.send('post logout');
});

//Refresh access token
router.post('/refresh', (req,res) => {
    res.send('post Refresh');
});

//Password reset request
router.post('/forgot-password', (req,res) => {
    res.send('post forgot password');
});

//Reset password with token
router.post('/reset-password', (req,res) => {
    res.send('Post reset password');
});
module.exports = router;
