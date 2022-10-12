var collection=require("../config/collection")
var db=require("../config/connection")

var objectId = require("mongodb").ObjectID

module.exports=
{

    addAdminCred: function()
    {
        return new Promise((res,rej)=>
        {
          let adminDetails={
            Email:"devajithmr@gmail.com",
            Password:"12345"

          }
          db.get().collection(collection.getAdminCollection).findOne({Email:"devajithmr@gmail.com"}).then((data)=>
          {
            if(data)
            {
                 console.log("admin data is already present")
                 res(data)
            }
            else{
              db.get().collection(collection.getAdminCollection).insertOne(adminDetails).then((data)=>
          {
             res(data)
          })
            }
          })
          
        })
    },

    doLogin: function(adminData)
    {
      return new Promise(async(res,rej)=>
      {
         let admins=await db.get().collection(collection.getAdminCollection).findOne({Email:adminData.Email})
         if(admins)
         {
            
            
                if(admins.Password==adminData.Password)
                {
                    console.log("login success")
                    res(admins)
                }
                else
                {
                     console.log("incorrect Password")
                     res(null)
                }
            
         }
         else
         {
                   console.log("invalid admin")
                   res(null)
         }
       })
      },
      getOrders: function()
      {
        return new Promise(async (res,rej)=>
        {
          let orders=await db.get().collection(collection.getOrderCollection).aggregate().toArray()
          res(orders)
        })
        
      },
      confirmOrder:function(cartId)
      {
        return new Promise( (res,rej)=>
        {
          db.get().collection(collection.getOrderCollection).updateOne({_id:objectId(cartId)},{$set:{status:"Confirmed and shipped"}}).then((response)=>
          {
            res(response)
          })
   
        })
      },
      cancelOrder: function(cartId)
      {
        return new Promise( (res,rej)=>
        {
          db.get().collection(collection.getOrderCollection).updateOne({_id:objectId(cartId)},{$set:{status:"Order Cancelled"}}).then((response)=>
          {
            res(response)
          })
   
        })
      }

}