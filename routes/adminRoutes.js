    const express = require('express')
    const router= express.Router()
    const adminController = require('../controller/adminController')
    const categoryController = require('../controller/categoryController')
    const customerController = require('../controller/customerController')
    const productController = require('../controller/productController')
    const brandController = require('../controller/brandController')
    const isAdmin = require('../middlewares/isAdmin')
    const nocache = require('nocache')
    const userController = require('../controller/userController')
    const orderController = require('../controller/orderController')



    router.get('/admin',isAdmin,adminController.adminHome)
    router.post('/generate-report',adminController.generateReport)

    router.get('/adminlogin',adminController.getadminLogin)
    router.post('/submit',adminController.postadminLogin)
    router.get('/adminlogout',adminController.getlogout)

    router.get('/admin/category',isAdmin,categoryController.getcategory)
    router.get('/admin/category/add',categoryController.getaddcategory)
    router.post('/publish',categoryController.postaddcategory)
    router.get('/admin/category/edit/:Id',isAdmin,categoryController.getEditcategory)
    router.post('/update/:Id',categoryController.postEditcategory)
    router.get('/published/:Id',categoryController.publishcategory)
    router.get('/unpublished/:Id',categoryController.unpublishcategory)

    router.get('/admin/customer',customerController.getcustomer)
    router.get('/block/:userId',customerController.blockuser)
    router.get('/unblock/:userId',customerController.unblockuser)

    router.get('/admin/product',isAdmin,productController.getproducts)
    router.get('/admin/product/add',isAdmin,productController.getaddproducts)
    router.post('/productsubmit',productController.postaddproduct)
    router.get('/publish/:Id',productController.publishProduct)
    router.get('/unpublish/:Id',productController.unpublishProduct)
    router.get('/admin/product/edit/:Id',isAdmin,productController.geteditProducts)
    router.post('/productedit/:Id',productController.posteditProduct)

    router.get('/admin/brand',isAdmin,brandController.getbrand)
    router.get('/admin/brand/add',isAdmin,brandController.getaddBrand)
    router.post('/submited',brandController.postaddbrand)
    router.get('/admin/brand/edit/:Id',brandController.getEditbrand)
    router.post('/updates/:Id',brandController.postEditbrand)
    router.get('/publishedd/:Id',isAdmin,brandController.publishbrand)
    router.get('/unpublishedd/:Id',brandController.unpublishbrand)

    router.get('/admin/orders',isAdmin,orderController.getorder)
    router.get('/admin/orderdetails/:Id',isAdmin,orderController.orderdetails)
    router.patch('/updatestatus',isAdmin,orderController.updatestatus)

    router.get('/admin/coupon',adminController.getCoupon)
    router.get('/admin/coupon/add',adminController.getAddCoupon)
    router.post('/couponsubmit',adminController.postaddcoupon)
    router.get('/couponpublishedd/:Id',isAdmin,adminController.publishcoupon)
    router.get('/couponunpublishedd/:Id',adminController.unpublishcoupon)


    router.get('*',adminController.error)



    module.exports= router