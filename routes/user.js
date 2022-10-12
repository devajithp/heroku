const { response } = require('express');
var express = require('express');
const collection = require('../config/collection');
var router = express.Router();
var productHelpers= require("../Helpers/Product-helpers")
var userHelpers=require("../Helpers/User-helpers")
var adminHelpers=require("../Helpers/Admin-helpers")

const verifyLogin=function(req,res,next)
{
  if(req.session.userLogged)
  {
      next()
  }
  else
  {
    res.redirect("/login")
  }
}

router.get('/', async function(req, res, next) {

  await adminHelpers.addAdminCred()
  let user=req.session.user
  productHelpers.getProduct().then((product)=>
  {
    res.render('user/userHome', {user,product,admin:false});
  })
  
});
router.get("/login",(req,res)=>
{
    res.render("user/user-login")
})
router.get("/signup",(req,res)=>
{
  res.render("user/user-signup")
})
router.post("/signup",(req,res)=>
{
  console.log(req.body)
  userHelpers.doSignUp(req.body).then((data)=>
  {
    console.log(data)
    res.redirect("/login")
  })
})
router.post("/login",(req,res)=>
{
  let user=req.body;
  userHelpers.doLogIn(user).then((response)=>
  {
    if(response.status)
    {
      req.session.user=response.user
      req.session.userLogged=true

      res.redirect("/")
    }
    else{
      res.redirect("/login")
    }
  })
})
router.get("/logout",(req,res)=>
{
  req.session.destroy()
  res.redirect("/")
})
router.get("/cart",verifyLogin,(req,res)=>
{
   let user=req.session.user
   userHelpers.getCart(user._id).then((cartItems)=>
   {
    if(cartItems)
    {
    userHelpers.getCartWithoutAggregate(user._id).then((cart)=>
    { 
      userHelpers.getTotalAmount(user._id).then((total)=>
      {
        if(total)
        {
          totalAmount=total.totalAmount
        }
        else{
          totalAmount=0;
        }
        if(cart)
        {
          let Product=cart.Product
          if(Product.length>=1)
          {
            
            res.render("user/cart",{admin:false,user,cartItems,totalAmount})
          }
          else{
            res.render("user/EmptyCart",{admin:false,user})
          }
        }
        else
         {
          res.render("user/EmptyCart",{admin:false,user})
         }
        
       
      })
    })
  }
  else{
    res.render("user/EmptyCart",{admin:false,user})
  }
   })
})
router.get("/addtoCart/:id/:Name/:Price",verifyLogin,(req,res)=>
{
  let userId=req.session.user._id;
  let prodId=req.params.id;
  let prodName=req.params.Name;
  let prodPrice=req.params.Price;
  
  userHelpers.AddtoCart(prodId,prodName,prodPrice,userId).then(()=>
  {
    res.redirect("/")
  })
  
})
router.get("/decrement/:prodId/:quantity",verifyLogin,(req,res)=>
{
  let prodId=req.params.prodId;
  let userId=req.session.user._id;
  let quantity=req.params.quantity;
 
  userHelpers.decrementQuantity(userId,prodId,quantity).then(()=>
  {
    res.redirect("/cart")
  })    
})
router.get("/increment/:prodId/:quantity",verifyLogin,(req,res)=>
{
  let userId=req.session.user._id;
  let prodId=req.params.prodId;
  let quantity=req.params.quantity;
  
  userHelpers.incrementQuantity(userId,prodId,quantity).then(()=>
  {
    res.redirect("/cart")
  })
})
router.get("/remove/:prodId/:quantity",verifyLogin,(req,res)=>
{
  let userId=req.session.user._id;
  let prodId=req.params.prodId;
  let quantity=req.params.quantity;
  
  userHelpers.removeProduct(userId,prodId,quantity).then(()=>
  {
    res.redirect("/cart")
  })

})
router.get("/home",(req,res)=>
{
  res.redirect("/")
})
router.get("/order/:total",verifyLogin,(req,res)=>
{
  let user=req.session.user
  let total=req.params.total
  res.render("user/order",{total,admin:false,user})
})
router.post("/orderSummary",verifyLogin,async (req,res)=>
{
  let DeliveryDetails=req.body
  
  let user=req.session.user
  let userId=user._id
  
  let total=await userHelpers.getTotalAmount(userId)
  if(DeliveryDetails.paymentOption=="COD")
  {
    userHelpers.getCart(userId).then((cartItems)=>
    {
     
      res.render("user/orderSummary",{total,admin:false,cartItems,user,DeliveryDetails})
    })
  }
  else if(DeliveryDetails.paymentOption=="Online"){
    userHelpers.getCart(userId).then((cartItems)=>
    {
     
      res.render("user/orderSummaryOnline",{total,admin:false,cartItems,user,DeliveryDetails})
    })
  }

})
router.post("/orderPlaced",verifyLogin,async(req,res)=>
{
   let user=req.session.user
   let userId=user._id
   let DeliveryAddress=req.body;
   let total=await userHelpers.getTotalAmount(userId)
   let totalPrice=total.totalAmount;
   console.log(totalPrice)
   
   
   userHelpers.addToOrder(DeliveryAddress,userId).then((result)=>
   {
      console.log(result.insertedId)
      
      userHelpers.removeCart(userId).then(()=>
      {
        res.render("user/orderSuccess",{admin:false,user})
      })
      
      
   })
  
})
router.post("/orderPlacedOnline",verifyLogin,async (req,res)=>
{
   let user=req.session.user
   let userId=user._id
   let DeliveryAddress=req.body;
   
   
   
   let total=await userHelpers.getTotalAmount(userId)
   let totalPrice=total.totalAmount;
   console.log(totalPrice);
   userHelpers.addToOrder(DeliveryAddress,userId).then((result)=>
   {
    let orderId=result.insertedId;
    
     userHelpers.generateRazorpay(orderId,totalPrice).then( async(order)=>
     {
      let user=req.session.user;
      let userId=user._id
      await userHelpers.removeCart(userId)
      console.log(order)
      res.json(order)
     })
    
    
   })
    

      
     
      
      
      
   })
  

router.get("/getOrders",verifyLogin,(req,res)=>
{
  let user= req.session.user
  let userId=user._id
  userHelpers.getOrderedProductForUser(userId).then((userOrder)=>
  {
    if(userOrder)
    {
    res.render("user/getOrders",{userOrder,admin:false,user})
    }
    else
    {
      res.redirect("/")
    }
  })
})
router.post("/verify-payment",verifyLogin,(req,res)=>
{
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>
  {
    console.log("verifyPayment called")
    userHelpers.changeOrderStatus(req.body['order[receipt]']).then(()=>
    {
      console.log(req.body['order[receipt]'])
      console.log("status changed")
      
      res.json({status:true})
    })
  }).catch((err)=>
  {
     res.json({status:false})
  })
})
router.get('/orderSuccess-online',verifyLogin,(req,res)=>
{
  let user=req.session.user;
  res.render('user/orderSuccessOnline',{admin:false,user})
})

module.exports = router;
