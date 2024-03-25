const User  = require('../model/users')
const Order = require('../model/orders')

const customerController = {

//get customer
    getcustomer:async (req,res,next)=>{
        try{
            const order = await Order.findById().populate('items')
            const users = await User.find()
            console.log(order)
            res.render('admin/customer',{
                title :'Customers List',
                users : users,
                order: order
            })
        }
        catch(err){
            next(err)
        }
    },
    blockuser: async(req,res,next)=>{
        try{
            const userId = req.params.userId
            req.session.user = null
            req.user = null
            
            await User.findByIdAndUpdate(userId, { isBlocked: true })
            res.redirect('/admin/customer')
        }
        catch(err){
            next(err)
        }
    },
    unblockuser: async(req,res,next)=>{
        try{
            const userId = req.params.userId
            await User.findByIdAndUpdate(userId, { isBlocked: false })
            res.redirect('/admin/customer')
        }
        catch(err){
            next(err)
        }
    },






}

module.exports= customerController