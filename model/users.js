const mongoose= require('mongoose')

const userScema= mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    pass:{
        type:String,
        required:true
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    otp:{
        type: String 
        },
    otpExpiration:{
        type: Date 
    },
    created:{
        type:Date,
        required:true,
        default:Date.now
    }
})

module.exports= mongoose.model('User',userScema)