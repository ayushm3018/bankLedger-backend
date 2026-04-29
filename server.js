require("dotenv").config()
const app = require("./src/app");
const connectToDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function start(){
    try{
        await connectToDB();
        app.listen(PORT, ()=> console.log(`server is running on port ${PORT}`))
    } catch (err){
        console.error("Error starting the server", err);
        process.exit(1);
    }
}

start();