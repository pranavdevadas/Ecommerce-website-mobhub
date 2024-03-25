const session = require('express-session')
const User  = require('../model/users')
const isAdmin = require('../middlewares/isAdmin')
require('dotenv').config()
const AdminCridentials = require('../model/admincridentials')



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
    }








}

module.exports= adminController