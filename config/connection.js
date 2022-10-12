const mongoClient=require("mongodb").MongoClient

const state={
    db:null
}

module.exports.connects=function(callback)
{
    const url="mongodb://localhost:27017"
    const dbName="shoppingCart"

     mongoClient.connect(url,(err,data)=>
     {
         if(err)
         return callback(err)
         else
         
         state.db=data.db(dbName)
         return callback()
         
     })


}
module.exports.get=function()
{
    return state.db;
}