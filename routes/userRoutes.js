const express = require('express')
const router= express.Router()
const userController = require('../controller/userController')
const User = require('../model/users')
const Products  = require('../model/products')
const Brand = require('../model/brand')
const Category = require('../model/catogory')
const isUser = require('../middlewares/isUser')
const isAuth = require('../middlewares/auth')
const authController = require('../middlewares/auth')



router.get('/',userController.userHome)
router.get('/dashboard',isUser,userController.userHome)

router.get('/login',userController.getuserLogin)
router.post('/login',userController.postuserLogin)
router.get('/register',userController.getuserRegister)
router.post('/register',userController.postuserRegister)
router.get('/logout',userController.getlogout)

router.get('/productdetials/:Id',isUser,userController.getProductDetials)

// router.get('/sendOtp',userController.getotp)
router.post('/sendOtp',userController.postsendotp)
router.post('/verifyOtp',userController.postverifyotp)
router.post('/resendOtp',userController.resendotp)


router.get('/auth/google',authController.googleAuth)
router.get('/auth/google/callback',authController.googleAuthCallback)

router.get('/shop',isUser,userController.getshop)





module.exports= router