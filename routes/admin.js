var express = require('express');
var router = express.Router();
var productHelpers= require("../Helpers/Product-helpers")
var promise=require("promise")
var adminHelpers=require("../Helpers/Admin-helpers")

const verifyLogin=function(req,res,next)
{
  if(req.session.adminLoggin)
  {
    next()
  }
  else
  {
      res.render('admin/admin-login',{admin:true})
  }
}



router.get('/',verifyLogin, function(req, res, next) {
  
  
  productHelpers.getProduct().then((product)=>
  {
      
    
    res.render("admin/adminHome",{admin:true,product})
  })
  
});
router.get("/add-product",(req,res)=>
{
     res.render("admin/AddProduct",{admin:true})
}
)
router.post("/add-product",(req,res)=>
{
  
  productHelpers.addProduct(req.body,(id)=>
  {
   
    let image=req.files.Image
    image.mv("./public/product-images/"+id+".jpg",(err)=>
    {if(!err)
      res.redirect("/admin")
    })
    
    
  })
   
})
router.get("/edit-product/:id",(req,res)=>
{
  let prodId=req.params.id;
  
  productHelpers.editProduct(prodId).then((editingProduct)=>
  {
     console.log(editingProduct)
     res.render("admin/EditProduct",{editingProduct,admin:true})
  })
  
})
router.post("/edit-product/:id", (req,res)=>
{
  let prodId=req.params.id;
  productHelpers.updateProduct(prodId,req.body).then(()=>
  {
    res.redirect("/admin")
    if(req?.files?.Image)
    {
    let image=req.files.Image
    image.mv("./public/product-images/"+prodId+".jpg")
    }
    
  })   
})
router.get('/delete-product/:id',(req,res)=>
{
  let prodId=req.params.id;
 
  productHelpers.deleteProduct(prodId).then((status)=>
  {
    
    res.redirect("/admin/")
  })
})
router.post('/login',(req,res)=>
{
  let adminData=req.body;
  adminHelpers.doLogin(adminData).then((result)=>
  {
    req.session.admin=result;
    if(req.session.admin!=null)
    {
    req.session.adminLoggin=true
    }
    else
    {
      req.session.adminLoggin=false
    }
    res.redirect('/admin/')
  })
})
router.get("/logout",(req,res)=>
{
  req.session.destroy();
  res.redirect("/admin/")

})
router.get("/orders",verifyLogin,(req,res)=>
{
  adminHelpers.getOrders().then((orders)=>
  {
    
    res.render("admin/adminOrders",{admin:true,orders})
  })
 
})
router.post("/confirmOrder",verifyLogin,(req,res)=>
{
  
  let cartId=req.body.cartId
  
  adminHelpers.confirmOrder(cartId).then((response)=>
  {
    res.json(response)
  })
})
router.post("/cancelOrder",verifyLogin,(req,res)=>
{
  let cartId=req.body.cartId
  adminHelpers.cancelOrder(cartId).then((response)=>
  {
    res.json(response)
  })
})





module.exports = router;
