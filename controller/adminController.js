const session = require('express-session')
const User  = require('../model/users')
const isAdmin = require('../middlewares/isAdmin')
require('dotenv').config()
const AdminCridentials = require('../model/admincridentials')
const Coupon = require('../model/coupon')



const cridentials = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS
}

const adminController = {

//admin home
    adminHome:(req,res,next)=>{
        try{
            res.render('admin/adminHome')
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






}

module.exports= adminController