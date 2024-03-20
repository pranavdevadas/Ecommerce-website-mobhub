const User  = require('../model/users')

const customerController = {

//get customer
    getcustomer:async (req,res,next)=>{
        try{
            const users = await User.find()
            res.render('admin/customer',{
                title :'Customers List',
                users : users
            })
        }
        catch(err){
            next(err)
        }
    },
    blockuser: async(req,res,next)=>{
        try{
            const userId = req.params.userId
            
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