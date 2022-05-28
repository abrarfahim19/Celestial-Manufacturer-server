const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")("sk_test_51L45lUGe7ng92uQR3q1p5NMRKfTXQzKn9yu6QqQGfRouli1SLxD6H351BOGCU4Gc2efcMbWsey7dYgQ07IZtKMmX00X0eJEaCl");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden' })
      }
      req.decoded = decoded;
      next();
    });
}

//API Calling
async function run() {
    try {
        await client.connect();

        //DataBase Needed ::: User,Product,Order,Review,Payment
        const userCollection = client.db('celestial').collection('users');
        const productCollection = client.db('celestial').collection('products');
        const orderCollection = client.db('celestial').collection('orders');
        const reviewCollection = client.db('celestial').collection('reviews');
        const paymentCollection = client.db('celestial').collection('payments');


        //Admin Verify Middle Ware
        const verifyAdmin = async (req, res, next) => {
          const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({ email: requester });
          if (requesterAccount.role === 'admin') {
            next();
          }
          else {
            res.status(403).send({ message: 'Forbidden' });
          }
        };

        //Get User
        app.get('/user/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email: email };
          const user = await userCollection.findOne(query);
          res.send(user);
        });

        //Put User
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            console.log('Putting User Email: ',email);
            const user = req.body;
            const filter = { email: email };
            console.log(filter);
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, success:"true" });
        });

        //Get User
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            console.log('db connected')
            res.send(users);
        });

        //Make Admin (PUT) [updated]
        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
          const email = req.params.email;
          const filter = { email: email };
          const updateDoc = {
            $set: { role: 'admin' },
          };
          const result = await userCollection.updateOne(filter, updateDoc);
          res.send(result);
        });
      
        //Check Admin (Get)
        app.get('/admin/:email', async(req, res) =>{
          const email = req.params.email;
          const user = await userCollection.findOne({email: email});
          const isAdmin = user.role === 'admin';
          res.send({admin: isAdmin})
        });

        //Add a Product [imageBBLink check]
        app.post('/product', verifyAdmin, async (req, res) => {
          const product = req.body;
          const result = await productCollection.insertOne(product);
          res.send(result);
        });
        
        //Get all Product
        app.get('/product', async (req, res) => {
          const product = await productCollection.find().toArray();
          res.send(product);
        });

        //Get a single Product
        app.get('/product/:id', async (req, res)=>{
          const id = req.params.id;
          console.log(id);
          const query = {_id: ObjectId(id)};
          const product = await productCollection.findOne(query);
          res.send(product);
        });

        //Update a single Product
        app.put('/product/:id', async (req, res) =>{
          const id = req.params.id;
          const stock = req.body;
          const filter = {_id: ObjectId(id)};
          const options = { upsert: true };
          const updateDoc = {
            $set: stock,
          };
          const result = await productCollection.updateOne(filter, updateDoc, options);
          res.send(result)
        });

        //Get Orders
        app.get('/order', async (req, res) => {
          const orders = await orderCollection.find().toArray();
          res.send(orders);
        });
        
        //Get Individuals Order
        app.get('/order/:email', async (req, res) => {
          const email = req.params.email;
          const query = {email:email};
          const result = await orderCollection.find(query).toArray();
          res.send(result);
        });

        //Post Order
        app.post('/order', async (req, res) => {
          const order = req.body;
          const result = await orderCollection.insertOne(order);
          res.send(result);
        });
        
        //
        app.get('/shipment/:id',async (req,res)=>{
          const id = req.params.id;
          const filters = {_id: ObjectId(id)};
          const result = await orderCollection.find(filters).toArray();
          res.send(result)
        })

        //
        app.put('/shipment/:id',async (req,res)=>{
          const id = req.params.id;
          const filter = {_id:ObjectId(id)};
          const status = req.body;
          const options = { upsert: true };
          console.log(status);
          const updateDoc = {
            $set: status,
          };
          const result = await orderCollection.updateOne(filter, updateDoc, options);
          res.send(result);
        });

        // Write Review
        app.post('/review', async(req,res)=>{
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.send(result);
        });

        // Get Review
        app.get('/review',async (req,res)=>{
          const query ={}
          const result = await reviewCollection.find(query).toArray();
          res.send(result);
        })

        //Make Shipment
        // app.put('shipment/:id', async (req, res) =>{
        //   const id = req.params.id;
        //   const status = req.body;
        //   const filter = {_id: ObjectId(id)};
        //   const options = { upsert: true };
        //   const updateDoc = {
        //     $set: status,
        //   };
        //   const result = await orderCollection.updateOne(filter, updateDoc, options);
        //   res.send(result)
        // });
        
        //Stripe Payment
        app.post("/create-payment-intent", async (req, res) => {
          const { total } = req.body;
          console.log(total);
          const amount = parseInt(total * 100);
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            payment_method_types: ["card"],
          });
          res.send({ clientSecret: paymentIntent.client_secret });
        });
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
