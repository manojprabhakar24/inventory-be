import express from "express";
import { client } from "../index.js";
import { ObjectId } from "mongodb";
import auth from "../middleware/auth.js";
const customers = express.Router();

//CREATE customer

customers.post("/", async (req, res) => {
  const { customerName, contactNo, address, gstNumber } = req.body;

  if (
    customerName == "" ||
    customerName == null ||
    contactNo == "" ||
    contactNo == null ||
    address == "" ||
    address == null ||
    gstNumber == "" ||
    gstNumber == null
  )
    res.status(401).send({ message: "Invalid inputs" });
  else {
    const newCustomer = await createNewCustomer(
      customerName,
      contactNo,
      address,
      gstNumber
    );
    newCustomer
      ? res.send({ message: "New customer created successfully" })
      : res.status(401).send({ message: "Failed to create customer" });
  }
});

//READ customers

customers.get("/", auth, async (req, res) => {
  const getCustomers = await getAllCustomers();
  getCustomers
    ? res.send(getCustomers)
    : res.status(401).send({ message: "Failed to load customers" });
});

customers.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  const checkIdInsideDB = await getCustomerbyId(id);

  checkIdInsideDB
    ? res.send(checkIdInsideDB)
    : res.status(401).send({ message: "failed to load customer data" });
});

customers.put("/:id", auth, async (req, res) => {
  //assumed only customer address can be changed
  const { id } = req.params;
  const { address } = req.body;
  const checkIdInsideDB = await client
    .db("capstone")
    .collection("customers")
    .findOne({ _id: new ObjectId(id) });

  if (!checkIdInsideDB) res.status(401).send({ message: "invalid Id" });
  else {
    const updatedCustomer = await updateCustomerAddressinDB(id, address);
    console.log(updatedCustomer);
    updatedCustomer
      ? res.send({ message: "data updated successfully" })
      : res.status(401).send({ message: "failed to update data" });
  }
});

customers.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const checkIdInsideDB = await client
    .db("capstone")
    .collection("customers")
    .findOne({ _id: new ObjectId(id) });
  if (!checkIdInsideDB) res.status(401).send({ message: "invalid Id" });
  else {
    const deleteCustomer = await deleteCustomerbyId(id);
    deleteCustomer.deletedCount == 1
      ? res.send({ message: "Customer deleted successfully" })
      : res.status(401).send({ message: "failed to delete customer " });
  }
});

export default customers;

async function deleteCustomerbyId(id) {
  return await client
    .db("capstone")
    .collection("customers")
    .deleteOne({ _id: new ObjectId(id) });
}

async function updateCustomerAddressinDB(id, address) {
  return await client
    .db("capstone")
    .collection("customers")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { address: address } }
    );
}

async function getCustomerbyId(id) {
  return await client
    .db("capstone")
    .collection("customers")
    .findOne({ _id: new ObjectId(id) });
}

async function getAllCustomers() {
  return await client.db("capstone").collection("customers").find({}).toArray();
}

async function createNewCustomer(customerName, contactNo, address, gstNumber) {
  return await client.db("capstone").collection("customers").insertOne({
    customerName,
    contactNo,
    address,
    gstNumber,
  });
}
