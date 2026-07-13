const mongoose = require('mongoose')

const dbConnect = ()=>{
    mongoose
    .connect(`${process.env.MONGO_URI}/moovs`)
    .then((data)=>{
        console.log(`Database connected: ${data.connection.host}`)
    })
    .catch((err)=>{
        console.log(`MongoDb error: ${err.message}`)
        process.exit(1);
    })
}

module.exports = dbConnect;