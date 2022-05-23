const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient } = require("mongodb");

//Port Declaration
const app = express();
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());

//Custom MiddleWare

//API Calling

// Initial testing
app.get("/", (req, res) => {
    res.send("Celestial Server");
});

app.listen(port, () => {
    console.log(`Celestial Server Running on port ${port}`);
});
