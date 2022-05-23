const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

//Port Declaration
const app = express();
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());

//Setting Connection with MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9xb5u.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Custom MiddleWare

//API Calling
async function run() {
    try {
        await client.connect();

        //DataBase Needed For User,Product,Order,Review,Payment
        const userCollection = client.db('celestial_db').collection('users');
        const productCollection = client.db('celestial_db').collection('products');
        const orderCollection = client.db('celestial_db').collection('orders');
        const reviewCollection = client.db('celestial_db').collection('reviews');
        const paymentCollection = client.db('celestial_db').collection('payments');

        //Get User
        app.get('/user', async (req, res) => {
        const users = await userCollection.find().toArray();
        console.log('db connected')
        res.send(users);
        });

        //Put User


    }
    finally{

    }
}
run().catch(console.dir);

// Initial testing
app.get("/", (req, res) => {
    res.send("Celestial Server is running...");
});

app.listen(port, () => {
    console.log(`Celestial Server Running on the port ${port}`);
});
