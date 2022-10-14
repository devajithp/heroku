const mongoClient=require("mongodb").MongoClient

const state={
    db:null
}

module.exports.connects=function(callback)
{
    const url="mongodb+srv://devajith:MJC8tjq167Pktqwk@cluster0.jzonz9t.mongodb.net/?retryWrites=true&w=majority"
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