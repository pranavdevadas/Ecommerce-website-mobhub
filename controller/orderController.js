const Products  = require('../model/products')
const Brand = require('../model/brand')
const Order = require('../model/orders')


const orderController = {

    getorder: async (req,res,next) => {
        try{

            const orders = await Order.find().sort({ orderDate : -1 })

            res.render('admin/adminOrder',{
                title: 'Order',
                order: orders
            })
        }
        catch(err){
            next(err)
        }
    },

    orderdetails: async (req,res,next) => {
        try{
            const orderId = req.params.Id
            const orders = await Order.findOne({ _id : orderId}).populate('items.product')
            
            res.render('admin/adminOrderDetails',{
                title: 'Order Details',
                order: orders
            })

        }
        catch(err){
            next(err)
        }
    },

    updatestatus: async (req,res,next) => {
        try{

            const { orderId, productId, selectedStatus } = req.body;
            const order = await Order.findById(orderId);
            // const prodsProduct = order.items.find(item => item.product.toString() === productId)
            // console.log(10,prodsProduct);


            const updatedOrder = await Order.findOneAndUpdate(
                { _id: orderId, 'items.product': productId },
                { $set: { 'items.$.status': selectedStatus } },
                { new: true }
            );

            if (updatedOrder) {
                return res.json({ success: true, updatedOrder });
                
            } else {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            res.redirect('back')

        }
        catch(err){
            next(err)
        }
    }


}

module.exports = orderController