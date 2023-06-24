import { client } from "../index.js";
import express from "express";
import { ObjectId } from "mongodb";
import auth from "../middleware/auth.js";

const billing = express.Router();

//Updating and Deleting bills disabled as of now.
//Only Manager/Admin level access can be provided for doing the same

//GET all billed data

billing.get("/", auth, async (req, res) => {
  const getBilledData = await getAllBills();
  getBilledData
    ? res.send(getBilledData)
    : res.status(401).send({ message: "failed to load billed Data" });
});

//GET Bill by id

billing.get("/:billnumber", auth, async (req, res) => {
  const { billnumber } = req.params;
  console.log(billnumber);
  const getBillfromDB = await getBillByid(billnumber);
  getBillfromDB
    ? res.send(getBillfromDB)
    : res.status(401).send({ message: "failed to load billed data" });
});

//CREATE new Bill
billing.post("/", auth, async (req, res) => {
  const {
    customerName,
    billMode,
    creditPeriod,
    items,
    date,
    grossTotal,
    gstNumber,
    billingAddress,
    gst,
    NetTotal,
  } = req.body;
  const newBill = await createNewBill(
    customerName,
    billMode,
    creditPeriod,
    items,
    grossTotal,
    gstNumber,
    billingAddress,
    gst,
    NetTotal,
    date
  );
  // console.log(newBill);

  console.log(items);

  // Update Stock in DB
  for (let billItem in items) {
    const updateIteminDB = await updateStockinDB(items, billItem);
    console.log(updateIteminDB);
  }
  newBill
    ? res.send({
        message: "New Bill Created Successfully",
      })
    : res.status(401).send({ message: "Failed to create new bill" });
});

//DELETE a bill

billing.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const checkIdInsideDB = await client
    .db("capstone")
    .collection("bills")
    .findOne({ _id: new ObjectId(id) });
  if (!checkIdInsideDB)
    res.status(401).send({ message: "Invalid ID . Try again" });
  else {
    const deleteBillfromDB = await deleteBillByid(id);
    deleteBillfromDB.deletedCount == 1
      ? res.send({ message: "Bill Deleted Successfully" })
      : res.status(401).send({ message: "Failed to delete Bill" });
  }
});

//UPDATE a bill for setting payment status

billing.put("/:id", auth, async (req, res) => {
  //Only payment status will be uploaded as PAID
  // No other alterations will be made on the database stored
  const { id } = req.params;
  console.log(id);
  const checkIdInsideDB = await client
    .db("capstone")
    .collection("bills")
    .findOne({ _id: new ObjectId(id) });
  console.log(checkIdInsideDB);
  if (!checkIdInsideDB) res.status(401).send({ message: "Invalid ID number" });
  else {
    const updateBillInsideDB = await updatePaymentStatusinDB(id);
    console.log(updateBillInsideDB);
    updateBillInsideDB.modifiedCount != 0
      ? res.status({ message: "Bill Status updated Successfully" })
      : res.status(401).send({ message: "Failed to Perform Payment Updation" });
  }
});

export default billing;

async function updatePaymentStatusinDB(id) {
  return await client
    .db("capstone")
    .collection("bills")
    .updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { billingStatus: "paid" },
      }
    );
}

async function deleteBillByid(id) {
  return await client
    .db("capstone")
    .collection("bills")
    .deleteOne({ _id: new ObjectId(id) });
}

async function updateStockinDB(items, billItem) {
  return await client
    .db("capstone")
    .collection("inventory")
    .updateOne(
      { name: items[billItem].name },
      {
        $inc: {
          billedQty: Number(items[billItem].qty),
          availableQty: -Number(items[billItem].qty),
        },
      }
    );
}

async function createNewBill(
  customerName,
  billMode,
  creditPeriod,
  items,
  grossTotal,
  gst,
  gstNumber,
  billingAddress,
  NetTotal,
  date
) {
  return await client
    .db("capstone")
    .collection("bills")
    .insertOne({
      customerName,
      billMode,
      creditPeriod,
      items,
      grossTotal,
      gst,
      gstNumber,
      billingAddress,
      NetTotal,
      date: new Date(date),
    });
}

async function getBillByid(billnumber) {
  return await client
    .db("capstone")
    .collection("bills")
    .findOne({ _id: new ObjectId(billnumber) });
}

async function getAllBills() {
  return await client.db("capstone").collection("bills").find({}).toArray();
}
