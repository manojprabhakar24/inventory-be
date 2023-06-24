import express from "express";
import { client } from "../index.js";
import auth from '../middleware/auth.js';
import { ObjectId } from "mongodb";

const purchase = express.Router();

purchase.get("/", auth, async (req, res) => {
  const getPOfromDB = await getPurchaseOrders();
  getPOfromDB
    ? res.send(getPOfromDB)
    : res.status(401).send({ message: "failed to load PO details" });
});

purchase.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const checkIdInsideDB = await getPurchaseOrderbyId(id);
  checkIdInsideDB
    ? res.send(checkIdInsideDB)
    : res.status(401).send({ message: "failed to load customer data" });
});

purchase.post("/", auth, async (req, res) => {
  const {
    isApproved,
    isScrutinized,
    isAuthorized,
    date,
    vendorName,
    grossTotal,
    gst,
    NetAmount,
    POItems,
  } = req.body;

  if (vendorName == null || POItems == null || NetAmount == 0)
    res.status(401).send({ message: "Invalid entries. pls check again" });
  else {
    const newPurchaseOrder = await createNewPurchaseOrder(
      isApproved,
      isScrutinized,
      isAuthorized,
      date,
      vendorName,
      grossTotal,
      gst,
      NetAmount,
      POItems
    );
    newPurchaseOrder
      ? res.send({ message: "New PO Created" })
      : res.status(401).send({ message: "failed to create new PO" });
  }
});

purchase.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const checkIdInsideDB = await client
    .db("capstone")
    .collection("purchase")
    .findOne({ _id: new ObjectId(id) });
  if (!checkIdInsideDB)
    res.status(401).send({ message: "Invalid ID . Try again" });
  else {
    const deleteBillfromDB = await deletePurchaseOrderbyId(id);
    deleteBillfromDB.deletedCount == 1
      ? res.send({ message: "Bill Deleted Successfully" })
      : res.status(401).send({ message: "Failed to delete Bill" });
  }
});

export default purchase;


async function deletePurchaseOrderbyId(id) {
  return await client
    .db("capstone")
    .collection("purchase")
    .deleteOne({ _id: new ObjectId(id) });
}

async function createNewPurchaseOrder(
  isApproved,
  isScrutinized,
  isAuthorized,
  date,
  vendorName,
  grossTotal,
  gst,
  NetAmount,
  POItems
) {
  return await client
    .db("capstone")
    .collection("purchase")
    .insertOne({
      isApproved,
      isScrutinized,
      isAuthorized,
      date: new Date(date),
      vendorName,
      grossTotal,
      gst,
      NetAmount,
      POItems,
    });
}

async function getPurchaseOrderbyId(id) {
  return await client
    .db("capstone")
    .collection("purchase")
    .findOne({ _id: new ObjectId(id) });
}

async function getPurchaseOrders() {
  return await client.db("capstone").collection("purchase").find({}).toArray();
}
