var collection=require("../config/collection")
var db=require("../config/connection")
var promise=require("promise")
var objectId = require("mongodb").ObjectID



module.exports=
{
    
        addProduct:function (product,callback)
        {
    
          
          db.get().collection("product").insertOne(product).then((data)=>{
            
            callback(data.insertedId)
          })
          
        },
        getProduct: function()
        {
          return new Promise(async (res,rej)=>
          {
            let products=await db.get().collection(collection.getProductCollection).find().toArray()
            
              
              res(products)
            
          })
          },
          editProduct: function(productId)
          {
            return new Promise(async (res,rej)=>
            {
              let editingProduct=await db.get().collection(collection.getProductCollection).find({_id:objectId(productId)}).toArray()
              res(editingProduct[0])
            })
          },
          updateProduct: function(prodId,product)
          {
            return new Promise( async (res,rej)=>
            {
              await db.get().collection(collection.getProductCollection).updateOne({_id:objectId(prodId)},
              {
                $set:{
                  Name:product.Name,
                  Price:product.Price,
                  Description:product.Description
                }
              })
              
                res()
              
              
            })
          },
          deleteProduct: function(prodId)
          {
            return new Promise((res,rej)=>
            { 
              db.get().collection(collection.getProductCollection).deleteOne({_id:objectId(prodId)}).then((status)=>
              {
                res(status)
                
              })
            
                 
            
            })
            
          }
           
    
    
}