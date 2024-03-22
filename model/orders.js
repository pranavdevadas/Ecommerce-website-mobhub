const mongoose = require('mongoose')
const orderScema = mongoose.Schema({

    trackingId:{
        type:String,
        default:function(){
           return Math.floor(100000 + Math.random() * 900000).toString();
        },
        unique:true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'product',
                require: true
            },
            price: {
                type: Number,
                default: 0,                
            },
            quantity: {
                type: Number,
                required: true,
            }
        }
    ],
    totalprice: {
        type: Number,
        default: 0
    },
    billingdetails:{
        name: String,
        buildingname:String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        phone: String,
        email: String,
    },
    amount: {
        type: Number
    },
    status: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
        default: "Pending",
    },
    paymentMethod: {
    type: String,
    required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },

})

module.exports= mongoose.model('Order',orderScema)