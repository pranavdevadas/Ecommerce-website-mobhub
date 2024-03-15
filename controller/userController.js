const User  = require('../model/users')
const Products  = require('../model/products')
const Category = require('../model/catogory')
const Brand = require('../model/brand')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const passport = require('passport')
require('dotenv').config()

const bcrypt = require('bcrypt')
const saltpassword = 10

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  })

const userController = {

//home
    userHome: async(req,res,next)=>{
        try{
            const products = await Products.find({ispublished:true}).populate('category').populate('brand')
            res.render('home',{
                title : 'Dashboard',
                products : products,
                user:req.session.user||req.user
            })
        }
        catch(err){
            next(err)
        }
    },
//login get
    getuserLogin:(req,res,next)=>{
        try{
            res.render('userLogin',{title:'Login'})
        }
        catch(err){
            next(err)
        }
    },
//login post
    postuserLogin: async (req,res,next)=>{
        try{
            const data = await User.findOne({email:req.body.email})

            if(data){
                const passwordMatch = await bcrypt.compare(req.body.password,data.pass)
                
                if(data.isVerified==false){
                    res.render('otp',{
                        title: "OTP",
                        alert: "Your account is not verified. Please check your email for the verification OTP." ,
                        email: req.body.email
                    })

                }
                else if(data.isBlocked){
                    
                    res.render('userLogin',{
                        alert: 'Sorry! You are blocked.'
                    })
                }
                else if(passwordMatch){
                    const user = true
                    req.session.user = req.body.email,
                    req.session.isUser = true,

                    req.session.isLogged = true;
                    req.session.userID = data._id;

                    res.redirect('/dashboard',500,{
                        user: req.session.user
                    })
                }
                else{
                    res.render('userLogin',{
                        title:'Login',
                        alert:'Entered Email or Password is incorrect'
                    })  
                }
            }
            else{
                res.render('userRegister',{
                    title:'Sign Up',
                    signup:'Account does not exist, Please Register.'
                })
            }
        }
        catch(err){
            next(err)
        }
    },
// register get
    getuserRegister:(req,res,next)=>{
        try{
            res.render('userRegister',{title:'Sign up'})
        }
        catch(err){
            next(err)
        }
    },
    //register post
    postuserRegister: async (req,res,next)=>{
        try{
            const existingEmail = await User.findOne({email:req.body.email})

            if(existingEmail){
                res.render('userLogin',{
                    title:'Sign up',
                    alert:'Email id already exist, Try with other email id'
                })
            }
            else{
                const hashedpassword = await bcrypt.hash(req.body.password,saltpassword)
                const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false })

                const user = new User ({
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    pass: hashedpassword,
                    otp: otp
                });
                
                await user.save()

                const mailOptions = {
                    from: 'pranavdevadas2@gmail.com',
                    to: req.body.email,
                    subject: 'OTP Verification',
                    text: `Your OTP is: ${otp}`,
                  }

                await transporter.sendMail(mailOptions)

                req.session.tempEmail = req.body.email
                res.render('otp',{
                    title: "OTP",   
                    email: req.session.tempEmail,
                  })
            }
            res.render('otp',{
                title:'OTP',
                email:req.session.tempEmail
            })
        }
        catch(err){
            next(err)
        }
    },
//get otp
    getotp:(req,res,next)=>{
        try{
            res.render('otp',{
                title:'OTP Verification',
                email:req.session.tempEmail,
            })

            res.redirect('/login')
        }
        catch(err){
            next(err)
        }
    },
    postsendotp:(req,res,next)=>{
        try{
            
            const otp = req.body.otp

              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  return res.status(500).json({ error: 'Failed to send OTP' });
                }
                res.json({ success: 'OTP sent successfully' });
              });
        }
        catch(err){
            next(err)
        }
    },
//post verify otp
    postverifyotp: async (req,res,next)=>{

        const email = req.body.email
        const user = await User.findOne({ email });
        const userEnteredOtp = req.body.otp;

        if(!user) {
            return res.render('otp',{
                email,
                alert:'User not found. Please check your email and try again.'
            })
        }

        if(user.otp === userEnteredOtp){
            req.session.tempEmail = null

            user.isBlocked = false
            user.isVerified = true
            await user.save()

            res.redirect('/login',500,{
                otpalert:'OTP verified successfully'
            })
        }
        else{
            res.render('otp',{
                title:'OTP',
                email,
                alert:'Invalid OTP. Please try again'
            })
        }
    },
// resend otp
    resendotp: async (req,res,next)=>{
        try{
            req.session.tempEmail = req.body.email
            const userEmail = req.session.tempEmail
            console.log(userEmail);
            

            const user = await User.findOne({email:userEmail})
            console.log(user);

            const newOTP = otpGenerator.generate(6, { digits: true, alphabets: true, upperCase: true, specialChars: false })

            user.otp = newOTP
            await user.save()

            const mailOptions = {
                from: 'pranavdevadas2@gmail.com',
                to: req.body.email,
                subject: 'OTP Verification',
                text: `Your new OTP is: ${newOTP}`,
              }

            await transporter.sendMail(mailOptions)

            req.session.tempEmail = req.body.email
            res.render('otp',{
                title: "OTP",   
                email: req.session.tempEmail,
              })
              res.redirect('/login')

        }
        catch(err){
            next(err)
        }
    },
      
//shop 
    getshop:async(req,res,next)=>{
        try{
            const product =await Products.find({ispublished:true}).populate('brand').populate('category')
            res.render('shop',{
                title:'Shop',
                products: product,
                user: req.session.user||req.user
            })
        }
        catch(err){
            next(err)
        }
    },
// 404  error
    error:(req,res)=>{
        res.render('error404')
    },  
//get product list 
getproductlist:async (req,res,next)=>{
    try{
        const user = await User.find({isBlocked : false})
        const products = await Products.find({ispublished:true})
        const brand = await Brand.find({isListed:true})
        const category = await Category.find({isListed:true})
        res.render('home',{
            title : 'Home',
            category : category,
            products : products,
            brand : brand,
            user : user
        })
        
    }
    catch(err){
        next(err)
    }
},
//get product detials
getProductDetials: async(req,res,next)=>{
    try{
        const Id = req.params.Id
        const product = await Products.find({_id:Id}).populate('category').populate('brand')
        if(!product){
            res.redirect('/')
        }
        else{
            res.render('productDetials',{
                title :'Product Detials',
                product : product
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
            req.session.user = null
            req.user = null
            
            res.render('userLogin',{
                title:'Login',
                logout:'Logout Successfully'
            })
        } catch (err) {
            next(err);
        }
    },






    
}


module.exports= userController