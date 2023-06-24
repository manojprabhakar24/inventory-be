import { client } from "../index.js";
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import { ObjectId } from "mongodb";

const others = express.Router();
async function getHashedPassword(password) {
  const No_of_Rounds = 10;
  const salt = await bcrypt.genSalt(No_of_Rounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

others.put("/stock/:id", async (req, res) => {
  const { id } = req.params;
  const { newStock } = req.body;
  if (newStock < 0)
    res.status(401).send({ message: "Enter Valid Quantity Only" });
  else {
    const checkIdInsideDB = await client
      .db("capstone")
      .collection("inventory")
      .findOne({ _id: new ObjectId(id) });
    if (!checkIdInsideDB) res.status(401).send({ message: "Invalid ID" });
    else {
      const updatedStockfromStores = await client
        .db("capstone")
        .collection("inventory")
        .updateOne(
          { _id: new ObjectId(id) },
          {
            $inc: {
              totalQty: Number(newStock),
              availableQty: Number(newStock),
            },
          }
        );
      console.log(updatedStockfromStores);
      updatedStockfromStores.modifiedCount != 0
        ? res.send({ message: "Stock Successfully Updated !!" })
        : res.status(401).send({ message: "Failed to Update the Stock" });
    }
  }
});

others.get("/users", async (req, res) => {
  const getUsersfromDB = await client
    .db("capstone")
    .collection("users")
    .find({})
    .toArray();
  getUsersfromDB
    ? res.send(getUsersfromDB)
    : res.status(401).send({ message: "failed to get users data" });
});

others.get("/billabstract", async (req, res) => {
  const getBillAbstract = await client
    .db("capstone")
    .collection("bills")
    .aggregate([
      {
        $group: {
          _id: "$customerName",
          TotalAmount: { $sum: "$NetTotal" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])
    .toArray();
  res.send(getBillAbstract);
});

//signin action
others.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  const checkUserinDB = await client
    .db("capstone")
    .collection("users")
    .findOne({ username });
  if (!checkUserinDB) res.status(401).send({ message: "User Doesn't exists" });
  else {
    const storedPassword = checkUserinDB.password;
    console.log(storedPassword);
    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    if (!isPasswordValid)
      res.status(401).send({ message: "Invalid credentials" });
    const token = jwt.sign({ _id: checkUserinDB._id }, process.env.SECRET_KEY);
    res.send({
      message: "Login Success",
      token,
      username: checkUserinDB.username,
      jobRole: checkUserinDB.jobRole,
      cadreID: checkUserinDB.cadreID,
    });
  }
});

//signup action
others.post("/signup", async (req, res) => {
  const { username, email, password, jobRole } = req.body;
  if (email == null || email == "")
    response.status(401).send({ message: "Enter valid Email-addresss 😮" });
  else {
    const checkEmailfromDB = await client
      .db("capstone")
      .collection("users")
      .findOne({ email, username });
    if (checkEmailfromDB)
      res.status(401).send({
        message: "User Id already exists, pls login and continue !!!!",
      });
    else {
      const hashedPassword = await getHashedPassword(password);
      let cadreID;
      if (jobRole == "stores") cadreID = 1;
      if (jobRole == "manager") cadreID = 2;
      if (jobRole == "accounts") cadreID = 3;
      if (jobRole == "head") cadreID = 4;
      if (jobRole == "admin") cadreID = 5;

      const newUserSignup = await client
        .db("capstone")
        .collection("users")
        .insertOne({
          username,
          password: hashedPassword,
          email,
          jobRole,
          cadreID,
        });
      newUserSignup
        ? res.send({ message: "New User Registered Successfully" })
        : res.status(401).send({ message: "failed to register user" });
    }
  }
});

export default others;
