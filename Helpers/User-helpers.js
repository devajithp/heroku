var collection=require("../config/collection")
var db=require("../config/connection")
var promise=require("promise")
var objectId = require("mongodb").ObjectID
var bcrypt= require("bcrypt")
const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: 'rzp_test_eixIFWkXHBMxdh',
  key_secret: 'NV0WGo11PM9ylIMhhUELQHjm'
});

module.exports={

   doSignUp: function(userData)
   {
    return new Promise(async (res,rej)=>
    {
        userData.Password=await bcrypt.hash(userData.Password,10)
        db.get().collection(collection.getUserCollection).insertOne(userData).then((data)=>
        {
            
            res(data)
        })
    })
   },
   doLogIn: function(userData)
   {
    let response={}
    return new Promise(async(res,rej)=>
    {
        let user=await db.get().collection(collection.getUserCollection).findOne({Email:userData.Email})
        
        if(user)
        {
              bcrypt.compare(userData.Password,user.Password).then((status)=>
              { if(status)
                {
                   
                   console.log("login success")
                   response.user=user
                   response.status=true
                   res(response)
                }
                else
                {
                    console.log("incorrect password")
                    response.status=false
                    res(response)
                }
                
                
              })

        }
        else
        { 
            console.log("invalid user")
            response.status=false
            res(response)
            

        }
    })
   },
   AddtoCart: function(productId,productName,productPrice,userId)
   {
         return new Promise(async(res,rej)=>
         {
            let user= await db.get().collection(collection.getCartCollection).findOne({user:userId})
            if(user)
            {
                db.get().collection(collection.getCartCollection).find({user:userId,"Product.prodId":productId}).count().then((count)=>
                {
                    if(count!=0)
                    {
                        
                        db.get().collection(collection.getCartCollection).updateOne({user:userId,"Product.prodId":productId},{$inc:{"Product.$.quantity":1}}).then(()=>
                        {
                            console.log("incremented quantity to existing product")
                            res()
                        })
                        
                    }
                    else
                    {
                       
                        db.get().collection(collection.getCartCollection).updateOne({user:userId},{$push:{Product:{prodId:productId,Name:productName,Price:productPrice,quantity:1}}}).then(()=>
                        {
                            console.log("added a new product to a existing user cart")
                            res()
                        })
                        
                    }
                })
                
                    
                
                
                
            }
            else
            {
               
                db.get().collection(collection.getCartCollection).insertOne({user:userId,Product:[{prodId:productId,Name:productName,Price:productPrice,quantity:1}]}).then(()=>
                {
                    console.log("added new usercart and product")
                    res()
                })
                
            }
         })
   },
   getCart: function(userId)
   {
    return new Promise(async (res,rej)=>
    {
        let cartItems= await db.get().collection(collection.getCartCollection).aggregate([{$match:{user:userId}},{$unwind:"$Product"}]).toArray()
        res(cartItems)
    })
   },
  decrementQuantity: function(userId,prodId,quantity)
  {
    return new Promise(async (res,rej)=>
    {
        if(quantity==1)
        {
            await db.get().collection(collection.getCartCollection).updateOne({user:userId,"Product.prodId":prodId},{$pull:{Product:{prodId:prodId}}})
            console.log("product removed")
            res()
        }
        else
        {
            await db.get().collection(collection.getCartCollection).updateOne({user:userId,"Product.prodId":prodId},{$inc:{"Product.$.quantity":-1}})
            console.log("quantity decremented")
            res()
        }
    })
    
  },
  incrementQuantity:function(userId,prodId,quantity)
  {
    return new Promise(async (res,rej)=>
    {
        await db.get().collection(collection.getCartCollection).updateOne({user:userId,"Product.prodId":prodId},{$inc:{"Product.$.quantity":1}})
        console.log("quantity incremented")
        res()
    })
  },
  removeProduct:function(userId,prodId,quantity)
  {
    return new Promise(async (res,rej)=>
    {
           await db.get().collection(collection.getCartCollection).updateOne({user:userId,"Product.prodId":prodId},{$pull:{Product:{prodId:prodId}}})
            console.log("product removed")
            res()
    })
  },
  getCartWithoutAggregate:function(userId)
  {
    return new Promise(async (res,rej)=>
    {
        let cart= await db.get().collection(collection.getCartCollection).findOne({user:userId})
        res(cart)
    })
  },
 getTotalAmount: function(userId)
 {
    return new Promise(async(res,rej)=>
    {
        let total=await db.get().collection(collection.getCartCollection).aggregate([{$match:{user:userId}},{$unwind:"$Product"},{$group:{_id:null,totalAmount:{$sum:{$multiply:["$Product.quantity",{$toInt:"$Product.Price"}]}}}}]).toArray()
        res(total[0])

    })
   
 },
 addToOrder: function(DeliveryAddress,userId)
 {
    return new Promise(async (res,rej)=>
    {
        let cartItems=await db.get().collection(collection.getCartCollection).aggregate([{$match:{user:userId}},{$unwind:"$Product"},{$project:{_id:0,user:0}}]).toArray()
        let date= new Date();
        let total=await db.get().collection(collection.getCartCollection).aggregate([{$match:{user:userId}},{$unwind:"$Product"},{$group:{_id:null,totalAmount:{$sum:{$multiply:["$Product.quantity",{$toInt:"$Product.Price"}]}}}}]).toArray()
        totalAmount=total[0].totalAmount
       
        let status="Pending with admin"
        let Payment="COD"
           
            let Orders={
                  userId:userId,
                  total:totalAmount,
                  date: date,
                  status,
                  cartItems,
                  DeliveryAddress,
                  Payment
                 }
    
                 db.get().collection(collection.getOrderCollection).insertOne(Orders).then((result)=>
                 {
                    res(result)
                 })


            })
        


       
        
    
    
 },
 getOrderedProductForUser: function(userId)
 {
    return new Promise(async (res,rej)=>
    {
        let userOrders= await db.get().collection(collection.getOrderCollection).aggregate([{$match:{userId:userId}}]).toArray()
        
        res(userOrders)
    })
 },
 removeCart: function(userId)
 {
    return new Promise(async (res,rej)=>
    {
        await db.get().collection(collection.getCartCollection).deleteOne({user:userId})
        res()
    })
 },
 generateRazorpay: function(orderId,totalPrice)
 {

   return new Promise((res,rej)=>
   {
    
    var options = {
        amount: totalPrice*100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: ""+orderId,
      };
      
      instance.orders.create(options, function(err, order) {
        
        res(order)
      });
   })
 },
 verifyPayment: function(details)
 {
    return new Promise((res,rej)=>
    {
        const crypto = require('crypto')
        let hmac= crypto.createHmac('sha256','NV0WGo11PM9ylIMhhUELQHjm')
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]'])
        {   console.log("verified")
            res()
        }
        else{
            rej()
        }
    })
 },
 changeOrderStatus: function(orderId)
 {
    return new Promise((res,rej)=>
    {
        db.get().collection(collection.getOrderCollection).updateOne({_id:objectId(orderId)},
        {
            $set:{status:'placed online',Payment:'online Payment'}
        }).then(()=>
        {
            res()
        })
    })
 }

   
        
    }
  

