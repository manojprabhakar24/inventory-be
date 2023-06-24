import { client } from "../index.js";
import express from "express";
import { ObjectId } from "mongodb";
import auth from "../middleware/auth.js";

const inventory = express.Router();

//READ inventory

inventory.get("/", auth, async (req, res) => {
  const getAllInventory = await GetAllInventory();
  getAllInventory
    ? res.send(getAllInventory)
    : res.status(401).send({ message: "failed to load the data" });
});

inventory.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const checkIdInsideDB = await GetInventoryById(id);
  if (!checkIdInsideDB) res.status(401).send({ message: "Invalid ID " });
  else {
    const getInventoryfromDB = await GetInventoryByID(id);
    console.log(getInventoryfromDB);
    getInventoryfromDB
      ? res.send(getInventoryfromDB)
      : res.status(401).send({ message: "failed to load the data" });
  }
});

//CREATE inventory

inventory.post("/", auth, async (req, res) => {
  const { name, units, HSNCode, totalQty, rate } = req.body;
  if (
    units == null ||
    units == "" ||
    HSNCode == null ||
    totalQty == null ||
    rate == null
  )
    res.status(401).send({ message: "Check input !!!!" });
  else {
    const newInventory = await createNewInventory(
      name,
      units,
      HSNCode,
      totalQty,
      rate
    );

    newInventory
      ? res.send({ message: "New Inventory added successfully" })
      : res.status(401).send({ message: "failed to load the data" });
  }
});


//UPDATE inventory

inventory.put("/:id", auth, async (req, res) => {
  //considered as rate can be updated
  //totalQty will be updated while making stock changes

  const { rate } = req.body;
  const { id } = req.params;
  const checkIdInsideDB = await GetInventory(id);
  console.log(checkIdInsideDB);
  if (!checkIdInsideDB) res.status(401).send({ message: "Invalid Id" });
  else {
    const updatedEntryinsideDB = await updateInventoryRate(id, rate);
    console.log(updatedEntryinsideDB);
    updatedEntryinsideDB
      ? res.send({ message: "Price updated successfully" })
      : res.status(401).send({ message: "failed to update the data" });
  }
});


//DELETE inventory

inventory.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const checkIdInsideDB = await client
    .db("capstone")
    .collection("inventory")
    .findOne({ _id: new ObjectId(id) });
  if (!checkIdInsideDB) res.status(401).send({ message: "Invalid Id" });
  else {
    const deleteInventory = await deleteInventorybyId(id);
    //   console.log(deleteInventory);
    deleteInventory.deletedCount == 1
      ? res.send({ message: "Deleted Inventory successfully" })
      : res.status(401).send({ message: "failed to delete inventory" });
  }
});

export default inventory;

async function deleteInventorybyId(id) {
  return await client
    .db("capstone")
    .collection("inventory")
    .deleteOne({ _id: new ObjectId(id) });
}

async function updateInventoryRate(id, rate) {
  return await client
    .db("capstone")
    .collection("inventory")
    .findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { rate: rate } });
}

async function GetInventory(id) {
  return await client
    .db("capstone")
    .collection("inventory")
    .findOne({ _id: new ObjectId(id) });
}

async function createNewInventory(name, units, HSNCode, totalQty, rate) {
  return await client
    .db("capstone")
    .collection("inventory")
    .insertOne({
      name,
      units,
      HSNCode,
      billedQty: 0,
      totalQty: Number(totalQty),
      availableQty: Number(totalQty),
      rate: Number(rate),
    });
}

async function GetInventoryByID(id) {
  return await client
    .db("capstone")
    .collection("inventory")
    .findOne({ _id: new ObjectId(id) });
}

async function GetInventoryById(id) {
  return await client
    .db("capstone")
    .collection("inventory")
    .findOne({ _id: new ObjectId(id) });
}

async function GetAllInventory() {
  return await client.db("capstone").collection("inventory").find({}).toArray();
}
