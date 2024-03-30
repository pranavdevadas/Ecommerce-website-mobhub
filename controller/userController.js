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
const crypto = require('crypto');
const moment = require('moment')



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

                const otp = Math.floor(100000 + Math.random() * 900000)

                

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
            

            const user = await User.findOne({email:userEmail})

            const newOTP = Math.floor(100000 + Math.random() * 900000)

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

//search
    search: async (req, res, next) => {
        try{
            const searchTerm = req.query.q

            const searchResult = await Products.find({ 
                $or: [
                    { productname: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                ]
            })

            res.render('search',{
                products: searchResult,
                title: 'Dashboard',
                user: req.session
            })
        }
        catch(err){
            next(err)
        }
    },
      
//shop 
    getshop:async(req,res,next)=>{
        try{
            const category = req.params.category || undefined
            let prod =await Products.find({ispublished:true}).populate('brand').populate('category')
            const sort = req.query.sort
        

            let query = { ispublished: true };


            if (sort === 'lowToHigh') {
                console.log('abc')
                prod = await Products.find(query).sort({ oldprice : 1 });
                console.log(1222, prod)
            } else if (sort === 'highToLow') {
                prod = await Products.find(query).sort({ oldprice : -1 });
                console.log(1333, prod)
            } else if (sort === 'A-Z') {
                prod = await Products.find(query).sort({ productname : 1 });
                console.log(1333, prod)
            } else if (sort === 'Z-A') {
                prod = await Products.find(query).sort({ productname : -1 });
                console.log(1333, prod)
            } else if (sort === 'newarrivals') {
                prod = await Products.find(query).sort({ created : -1 });
                console.log(1333, prod)
            } else {
                console.log(1444, prod)
                prod = await Products.find(query);
            }
            
            


            res.render('shop',{
                title:'Shop',
                products: prod,
                user: req.session.user||req.user,
                sort: sort,
                text: category,
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
            console.log(addressDocument);

            let addresses = []

            if (addressDocument) {
                addresses = addressDocument.addresses || []
            }

            res.render('checkout', {
                title: 'Checkout',
                user: req.session ||req.user,
                userCart,
                addresses: addresses
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
            const cartItems = JSON.parse(req.body.cartItem);
            let userAddress = await Address.findOne({ 'addresses._id': addressId });

            const address = userAddress.addresses.find(
                (addr) => addr._id.toString() === addressId
            )
            console.log(12345,address.pincode);
            const items = [];


            for (const item of cartItems) { 
                if (item.quantity) { 
                    items.push({
                        product: item.product,
                        price: item.price,
                        quantity: item.quantity,
                    });
                } else {
                    console.error(`Quantity missing for item ${item._id}`)
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
                    postalCode: address.pincode,
                    phone: user.phone,
                    email: user.email,
                },
                amount: totalprice,
                paymentMethod,

            })

            await order.save()

            await Cart.findOneAndUpdate(
                { userId: user._id },
                { $set:{ items: [],totalprice: 0 } }
            )

            for(const item of order.items){
                await Products.findByIdAndUpdate(
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
            // const userId = req.session.userID;
            // const addressDocument = await Address.findOne({ userId: userId });
            // console.log(addressDocument);
            // res.render('myAddress',{
            //     user: req.session,
            //     addresses:  addressDocument.addresses

            // })
            const userId = req.session.userID;
        const addressDocument = await Address.findOne({ userId: userId });

        if (!addressDocument || !addressDocument.addresses || addressDocument.addresses.length === 0) {
            // No addresses found, render a message
            return res.render('myAddress', {
                user: req.session,
                addresses: [],
                message: "No addresses found. Please add an address.",
                addAddressLink: "/addaddress" // Provide a link to add a new address
            });
        }

        res.render('myAddress', {
            user: req.session,
            addresses: addressDocument.addresses
        });
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
                user: req.session
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

            const previousPage = req.header('Referer') || '/'

            res.render(previousPage,{
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
            
            const orders = await Order.find().populate('items.product').sort({ orderDate : -1 })

            
            res.render('myorders', {
                title: 'My orders',
                user: req.session,
                order: orders,
            });
        }
        catch(err){
            next(err)
        }
    },
//order details page
    orderdetail: async (req,res,next) => {
        try{
            
            const orderId = req.params.Id
            const userId = req.session.userID
            const orders = await Order.findOne({ _id : orderId}).populate('items.product')
            const user = await Order.findOne({ userId : userId })
            
        
            res.render('orderDetial',{
                title: 'Order Detials',
                user: req.session,
                order: orders,
                users: user,
            })
        }
        catch(err){
            next(err)
        }
    },
// cancel order
    cancelorder: async (req,res,next) => {
        try{

            const { orderId, productId } = req.body;

            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            const cancelProduct = order.items.find(item => item.product.toString() === productId)
            console.log(cancelProduct);

            if (!cancelProduct) {
                return res.status(404).json({ message: 'Product not found in order' });
            }

            // Update product stock
            await Products.findByIdAndUpdate(cancelProduct.product, { $inc: { stock: cancelProduct.quantity } });
            

            // Update product status in order
            cancelProduct.status = 'Cancelled';
            await order.save();

            res.status(200).json({ message: 'Product Cancelled Successfully', cancelProduct });
            
        }
        catch(err){
            next(err)
        }
    },

// refund order
    returnorder: async (req,res,next) => {
        console.log('retn page');
        try{
            const { orderId, productId } = req.body;

            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            const cancelProduct = order.items.find(item => item.product.toString() === productId)
            console.log(cancelProduct);

            if (!cancelProduct) {
                return res.status(404).json({ message: 'Product not found in order' });
            }

            // Update product stock
            await Products.findByIdAndUpdate(cancelProduct.product, { $inc: { stock: cancelProduct.quantity } });
            

            // Update product status in order
            cancelProduct.status = 'Returned';
            await order.save();

            res.status(200).json({ message: 'Product Cancelled Successfully', cancelProduct });
            
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