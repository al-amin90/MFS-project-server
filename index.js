const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// connect mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hjmc0vt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("mfsProject");
    const usersCollection = db.collection("users");

    // sing up and log in

    // write all mongodb api code here
    app.post("/users", async (req, res) => {
      const currentUser = req.body;

      // check if the user already exits in the database
      const existingUser = await usersCollection.findOne({
        email: currentUser.email,
      });
      console.log(existingUser);

      if (existingUser) {
        res.send({ result: "user already exits. Choose Other Email" });
        return;
      }

      // hash the password useing bcrypt
      const saltRounds = 10;
      const hashPassword = await bcrypt.hash(currentUser.password, saltRounds);
      currentUser.password = hashPassword;
      const result = await usersCollection.insertOne(currentUser);
      res.send(result);
    });

    app.post("/login", async (req, res) => {
      try {
        const check = await usersCollection.findOne({ email: req.body.email });
        console.log(check);
        if (!check) {
          res.send({ result: "user email not found" });
        }

        // compare the hash password from the database with the plain text
        const isPasswordMatch = await bcrypt.compare(
          req.body.password,
          check.password
        );
        console.log(isPasswordMatch);
        if (isPasswordMatch) {
          res.send({ result: true }).status(200);
          return;
        } else {
          res.send({ result: "Wrong Password" });
        }
      } catch {}
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("MFS Server is running perfectly...");
});

app.listen(port, () => {
  console.log(`MFS server is running port, ${port}`);
});
