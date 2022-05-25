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
            res.send({ result, token });
        });

        //Get User
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            console.log('db connected')
            res.send(users);
        });

        //Make Admin (PUT)
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            console.log('param email', email);
            const requester = req.decoded.email;
            console.log('Requester Email', requester);
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
              const filter = { email: email };
              const updateDoc = {
                $set: { role: 'admin' },
              };
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
            }
            else{
              res.status(403).send({message: 'forbidden'});
            }
      
          })
      
        //Check Admin (Get)
        app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
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
