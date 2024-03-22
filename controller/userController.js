const User  = require('../model/users')
const Products  = require('../model/products')
const Category = require('../model/catogory')
const Brand = require('../model/brand')
const nodemailer = require('nodemailer')
const otpGenerator = require('otp-generator')
const passport = require('passport')
require('dotenv').config()
const Cart = require('../model/cart')
const Address = require('../model/address')
const Order = require('../model/orders')



const bcrypt = require('bcrypt')
const address = require('../model/address')
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
                user: req.session.user||req.user
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
//checkout page
    checkout: async (req,res,next)=>{
        try{

            const userId = req.session.userID
            const userCart = await Cart.findOne({userId : userId}).populate({path:'items.product', model: 'product' })
            const addressDocument = await Address.findOne({ userId: userId });

            res.render('checkout', {
                title: 'Checkout',
                user: req.session.user||req.user,
                userCart,
                addresses:  addressDocument.addresses
            })
        }
        catch(err){
            next(err)
        }
    },
// check out post
    postcheckout: async(req,res,next) => {
        try{
            const { addressId, paymentMethod, totalprice } = req.body
            const user = await User.findById(req.session.userID)
            const cartItems = req.body.cartItem
            const address = await Address.findOne({ "addresses._id": addressId })
            const items = [];

            for (const key in cartItems) {
                if (Object.hasOwnProperty.call(cartItems, key)) {
                    const item = cartItems[key];

                    if (item.quantity) {
                        items.push({
                            product: item.product,
                            price: item.price,
                            quantity: item.quantity,
                        });
                    } else {
                        console.error(`Quantity missing for item ${key}`);
                    }
                }
            }

            const order = new Order ({
                userId : user._id,
                items: items,
                totalprice : totalprice,
                billingdetails: {
                    name: user.name,
                    buildingname: address.buildingname,
                    city: address.city,
                    state: address.state,
                    country: address.country,
                    postalcode: address.postalcode,
                    phone: user.phone,
                    email: user.email,
                },
                amount: totalprice,
                paymentMethod,

            })
            console.log(122,order)

            await order.save()

            await Cart.findOneAndUpdate(
                { userId: user._id },
                { $set:{ items: [],totalprice: 0 } }
            )

            for(const item of order.items){
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock : -item.quantity } },
                    { new: true }
                )
            }

            res.render('thankyouorder')

        }
        catch(err){
            next(err)
        }
    },


//my profile
    myprofie: async (req,res,next)=>{
        try{

            const userId = req.session.userID;
            const addressDocument = await Address.findOne({ userId: userId });

            if (addressDocument && addressDocument.addresses) {

                res.render('myprofile', {
                    title: 'My profile',
                    user: req.session.user,
                    addresses: addressDocument.addresses,
                    userId
                });
            } else {
                res.render('myprofile', {
                    title: 'My profile',
                    user: req.session.user,
                    addresses: []
                });
            }
        }
        catch(err){
            next(err)
        }
    },

//get my addres
    getmyaddress: async (req,res,next) => {
        try{
            const userId = req.session.userID;
            const addressDocument = await Address.findOne({ userId: userId });
            res.render('myAddress',{
                user: req.session,
                addresses: addressDocument.addresses,

            })
        }
        catch(err){
            next(err)
        }
    },
//add new address
    addaddress: async (req,res,next) => {
        try{
            res.render('addaddress',{
                title: 'My Address',
                user: req.session.user
            })
        }
        catch(err){
            next(err)
        }
    },

// edit address
    geteditaddress: async (req,res,next) => {
        try{
            const addressId = req.params.Id
            const userId = req.session.userID || req.user._id;
            let userAddress = await Address.findOne({ userId: userId });

            const address = userAddress.addresses.find(
                (addr) => addr._id.toString() === addressId
            )

            res.render('editAddress',{
                title: 'Edit Address',
                address: address,
                user: req.session.userID,
                message:'Address edited successfully',
            })
        }
        catch(err){
            next(err)
        }
    },
//post edit address
    posteditaddress: async (req,res,next)=>{
        try{
            const addressId = req.params.Id
            const userId = req.session.userID || req.user._id;
            let userAddress = await Address.findOne({ 'addresses._id': addressId });
            // const { buildingname, pincode, city, state, country } = req.body
            
            const address = userAddress.addresses.find(
                (addr) => addr._id.toString() === addressId
            )

            address.buildingname = req.body.buildingname,
            address.pincode = req.body.pincode,
            address.city = req.body.city,
            address.state = req.body.state,
            address.country = req.body.country

            await userAddress.save()

            res.render('myAddress',{
                title: 'My Address',
                message: 'Successfully Address Updated',
                user: req.session.userID,
                addresses: userAddress.addresses,
                userId : req.session.userID
            })
            
    }
        catch(err){
            next(err)
        }
    },
// delete address
    deleteAddress: async (req,res,next) => {
        
        try{
            const addressId = req.params.Id
            const userId=req.session.userID
            

            const deletedAddress = await Address.findOneAndUpdate(
                { userId: userId },
                { $pull: { addresses: { _id: addressId } } },
                { new: true }
            )

            res.render('myprofile', {
                message: 'Address Deleted Successfully',
                user: req.session.userId,
                addresses: address.addresses
            });
        }
        catch(err){
            console.log(err)
            next(err)
        }
    },
//add address post
    postaddaddress: async (req,res,next)=>{
        try{
            const userId = req.session.userID || req.user._id;
            
            let userAddress = await Address.findOne({ userId: userId });

            if (!userAddress) {
                userAddress = new Address({
                    userId: userId,
                    addresses: [{
                        buildingname: req.body.buildingname,
                        pincode: req.body.pincode,
                        city: req.body.city,
                        state: req.body.state,
                        country: req.body.country
                    }]
                });
            } else {

                userAddress.addresses.push({
                    buildingname: req.body.buildingname,
                    pincode: req.body.pincode,
                    city: req.body.city,
                    state: req.body.state,
                    country: req.body.country
                });
            }

            await userAddress.save();

            res.status(200).render('myAddress',{
                message:'Address added successfully',
                user: req.session.user,
                addresses: userAddress.addresses
            })
                
            }   
            catch(err){
                next(err)
            }
        },
//get account detials
    getaccontdetials: async (req,res,next) => {
        try{
            
            const userId = req.session.userID;
            const user = await User.findById(userId)

            res.render('accountdetials',{
                user: req.session,
                users: user,
                user: req.session,
                userId
            })
        }
        catch(err){
            next(err)
        }
    },
//post edit profile
    posteditprofile: async (req,res,next) => {
        try{

            // const userId = req.params.Id
            const userId = req.session.userID;
            const addressDocument = await Address.findOne({ userId: userId });

            await User.findByIdAndUpdate(userId,{
                name:req.body.name,
                email:req.body.email,
                phone:req.body.phone,
                
            })
            res.render('accountdetials',{
                title: 'Account Detials',
                message: 'Updated Sucessfully',
                user: req.session.userID,
                userId
            })            

        }
        catch(err){
            next(err)
        }
    },
// edit profile
    geteditprofile: async (req,res,next) => {
        try{
            const userId = req.params.Id
            const user = await User.findById(userId)
            const addressDocument = await Address.findOne({ userId: userId });


            res.render('editProfile',{
                title: 'Edit Profile',
                users: user,
                user: req.session.userID,
                addresses: addressDocument.addresses,

            })
        }
        catch(err){
            next(err)
        }
    },
// reset password
    resetpassword: async (req,res,next) => {
        try{
            const userId = req.params.Id
            const users = await User.findById(userId)


            res.render('resetPassword',{
                user: req.session,
                title: 'Reset Password',
                users: users,
                user: req.session
            })
        }
        catch(err){
            next(err)
        }
    },
// post reset password
    postresetpassword: async (req,res,next)=>{
        try{
            const userId = req.params.Id
            const data = await User.findById(userId)
            const passwordMatch = await bcrypt.compare(req.body.currentpassword,data.pass)
            const hashedpassword = await bcrypt.hash(req.body.newpassword,saltpassword)
            // const users = await User.findById(userId)

            if(passwordMatch){
                console.log('uuu');
                await User.findByIdAndUpdate(userId,{
                    pass : hashedpassword
                })
                res.render('accountdetials',{
                    message: 'Password Updated Successfully',
                    title: 'Account Detials',
                    users: data,
                    user: req.session,
                    userId
                })
            }
            else{
                res.render('accountdetials',{
                    alert : 'Entered Wrong current password & Try again',
                    user: req.session,
                    userId,
                })
            }
        }
        catch(err){
            next(err)
        }
    },


// get orders
    getorders: async (req,res,next) =>{
        try{
            
            const orders = await Order.find()
            const items = await Order.findOne({userId : req.session.userID})
            console.log(items)

            res.render('myorders',{
                title: 'My orders',
                user: req.session,
                order: orders,
                items: items
            })
        }
        catch(err){
            next(err)
        }
    },
// cancel/refund order
    cancelorder: async (req,res,next) => {
        console.log('dfdfd');
        try{
            const orderId = req.params.Id
            const order = await Order.findByIdAndUpdate(orderId, { status : 'Cancelled' })
            const orders = await Order.find()


            for(const item of order.items){
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock : +item.quantity } },
                    { new: true }
                )
            }
            res.render('myorders',{
                title: 'My Orders',
                message: 'Order Cancelled Successfully',
                user: req.session,
                order: orders
            })
        }
        catch(err){
            next(err)
        }
    },
// cancel/refund order
    refundorder: async (req,res,next) => {
        try{
            const userId = req.session.ID
            const orderId = req.params.Id
            await Order.findByIdAndUpdate(orderId, { status : 'Cancelled' })
            const orders = await Address.findOne({ userId: userId });



            for(const item of order.items){
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock : +item.quantity } },
                    { new: true }
                )
            }
            res.render('myorders',{
                title: 'My Orders',
                message: 'Requested Sented Successfully',
                user: req.session,
                order: orders

            })
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
                logout:'Logout Successfully',
                
            })
        } catch (err) {
            next(err);
        }
    },







    
}


module.exports= userController