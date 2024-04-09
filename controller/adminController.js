const session = require('express-session')
const User  = require('../model/users')
const isAdmin = require('../middlewares/isAdmin')
require('dotenv').config()
const AdminCridentials = require('../model/admincridentials')
const Coupon = require('../model/coupon')
const Order = require('../model/orders')




const cridentials = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS
}

const adminController = {

//admin home
    adminHome : async (req,res,next)=>{
        try{

            const order = await Order.find().populate('items.product').sort({ orderDate : -1 })

            const salesCount = await Order.aggregate([
                { $match : { 'items.status' : 'Delivered' } },
                { $count : 'salesCount' }
            ])

            let count = 0

            if (salesCount.length > 0) {
               count =  salesCount[0].salesCount;
            } else {
               count = 0; 
            }

            const orderSum = await Order.aggregate([
                { $group : { _id : null, totalAmount : { $sum : '$totalprice' } } },
            ])

            let orderAmount = 0  

            if (orderSum.length > 0) {
                orderAmount =  orderSum[0].totalAmount;
            } else {
                orderAmount = 0; 
            }

            const discountSum = await Order.aggregate([
                { $group : { _id : null, discountAmount : { $sum : '$discountAmount' } } },
            ])

            let discountAmount = 0  

            if (discountSum.length > 0) {
                discountAmount =  discountSum[0].discountAmount;
            } else {
                discountAmount = 0; 
            }

            res.render('admin/adminHome',{
                title: 'Dashboard',
                count,
                orderAmount,
                discountAmount,
                order
            })
        }
        catch(err){
            next(err)
        }
    },

//admin login get
    getadminLogin:(req,res,next)=>{
        try{
            res.render('admin/adminLogin',{title:'Admin Login'})
        }
        catch(err){
            next(err)
        }
    },
//admin login post
    postadminLogin:async (req,res,next)=>{
        try{

            

            if(req.body.email===cridentials.email && cridentials.password){
                const admin = true
                    req.session.admin = req.body.email,
                    req.session.isAdmin = true,
                    // req.session.save()
                    res.redirect('/admin')
            }
            else{
                res.render('admin/adminLogin',{
                    title:'Admin Login',
                    alert:'Invalid Email or Password'
                })
            }
        }
        catch(err){
            next(err)
        }
    },
//logout
getlogout: (req, res, next) => {
        try {
            req.session.admin = null;
            res.render('admin/adminLogin',{
                title:'Admin Login',
                logout:'Logout Successfully'
            })
        } catch (err) {
            next(err);
        }
    },
    
    error:(req,res)=>{
        res.render('error404')
    },
// get coupon
    getCoupon: async (req,res,next) => {
        try{
            const coupon = await Coupon.find()

            res.render('admin/coupon',{
                title:'Brands',
                coupon: coupon
            })

        }
        catch(err){
            next(err)
        }
    },
//get add coupon
    getAddCoupon: (req,res,next) => {
        try{
            
            res.render('admin/addcoupon',{
                title: 'Add Coupon'
            })

        }
        catch(err){
            next(err)
        }
    },
// add coupon post
    postaddcoupon: async (req,res,next)=>{
        try{
            const existingcoupon = await Coupon.findOne({coupon:req.body.coupon})
            if(existingcoupon){
                res.render('admin/addcoupon',{
                    title:'Add Coupon',
                    alert: 'Coupon is alredy exist, try with other Coupon'
                })
            }
            else{
                const coupon = new Coupon({
                    coupon: req.body.coupon,
                    description: req.body.description,
                    percentage: req.body.percentage,
                    minimumamount: req.body.minimumamount,
                    maximumamount: req.body.maximumamount,
                    expiryDate: req.body.expiryDate
                })
                await coupon.save()
                res.redirect('/admin/coupon')
            }
        }
        catch(err){
            next(err)
        }
    },
//publish and unpublish brand
    unpublishcoupon: async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Coupon.findByIdAndUpdate(Id, { isListed: false })
            res.redirect('/admin/coupon')
        }
        catch(err){
            next(err)
        }
    },
    publishcoupon: async (req,res,next)=>{
        try{
            const Id = req.params.Id
            await Coupon.findByIdAndUpdate(Id, { isListed: true })
            res.redirect('/admin/coupon')
        }
        catch(err){
            next(err)
        }
    },
// generate report
    generateReport : async (req,res,next) => {
        try{
            const { startDate, endDate } = req.body;

            const orders = await Order.aggregate([
                { $match: { orderDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }},
                { $unwind: "$items" }, 
                // { $match: { "items.status": "Delivered" }},
                { $lookup: { 
                    from: "products", 
                    localField: "items.product",
                    foreignField: "_id",
                    as: "items.product"
                }},
                { $addFields: { "items.product": { $arrayElemAt: ["$items.product", 0] } }},
                { $group: { 
                    _id: "$_id",
                    userId: { $first: "$userId" },
                    items: { $push: "$items" },
                    totalPrice: { $first: "$totalprice" },
                    couponDiscount: { $first: "$discountAmount" },
                    billingDetails: { $first: "$billingdetails" },
                    paymentStatus: { $first: "$paymentStatus" },
                    orderDate: { $first: "$orderDate" },
                    paymentMethod: { $first: "$paymentMethod" }
                }}
            ]);

            // Mapping the aggregated data to the desired report format
            const reportData = orders.map((order, index) => {
                let totalPrice = 0;
                order.items.forEach(product => {
                    totalPrice += product.price * product.quantity;
                });

                return {
                    orderId: order._id,
                    date: order.orderDate,
                    totalPrice,
                    products: order.items.map(product => ({
                        productName: product.product.productname,
                        quantity: product.quantity,
                        price: product.price
                    })),
                    firstName: order.billingDetails.name,
                    address: order.billingDetails.city, 
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus
                };
            });

            res.json({ reportData });
        }
        catch(err){
            next(err)
        }
    }







}

module.exports= adminController