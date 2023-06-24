import express from "express";
import { client } from "../index.js";
import auth from "../middleware/auth.js";
import { ObjectId } from "mongodb";

const workflow = express.Router();

//CREATE  new workflow
workflow.post("/", auth, async (req, res) => {
  //admin can initiate workflow in the System flow while users are created

  const { empName } = req.body;
  const checkUserinDB = await client
    .db("capstone")
    .collection("users")
    .findOne({ username: empName });
  if (!checkUserinDB) res.status(401).send({ message: "User not found" });
  else {
    const eligibility = checkUserinDB.cadreID;
    if (eligibility == 1) {
      const newWorkflow = await client
        .db("capstone")
        .collection("workflow")
        .insertOne({
          empName,
          jobRole: checkUserinDB.jobRole,
          cadreID: eligibility,
          workflow: { message: "creation access provided" },
        });
      newWorkflow
        ? res.send(newWorkflow)
        : res.status(401).send({ message: "New Workflow Enabled for user" });
    } else if (eligibility >= 2) {
      const newWorkflow = await client
        .db("capstone")
        .collection("workflow")
        .insertOne({
          empName,
          jobRole: checkUserinDB.jobRole,
          cadreID: eligibility,
          workflow: new Array(),
        });
      newWorkflow
        ? res.send(newWorkflow)
        : res.status(401).send({ message: "New Workflow Enabled for user" });
    }
  }
});

//UPDATING a user for FOR APPROVAL
workflow.put("/:id", auth, async (req, res) => {
  const { id } = req.params; //Concerned Username will be used to send approval
  console.log(id);

  const {
    isApproved,
    isScrutinized,
    isAuthorized,
    vendorName,
    grossTotal,
    gst,
    NetAmount,
    POItems,
  } = req.body;
  const checkUserinDB = await client
    .db("capstone")
    .collection("workflow")
    .findOne({ _id: new ObjectId(id) });
  console.log(checkUserinDB);

  if (!checkUserinDB)
    res.status(401).send({ message: "Invalid User name. Check again" });
  else {
    if (isAuthorized != 1 || isScrutinized != 1 || isApproved != 1) {
      const updateWorkflow = await client
        .db("capstone")
        .collection("workflow")
        .updateOne(
          { _id: new ObjectId(id) },
          { $push: { workflow: req.body } }
        );
      console.log(updateWorkflow);
      const POUpdation = await client
        .db("capstone")
        .collection("purchase")
        .updateOne(
          { vendorName },
          {
            $set: {
              isApproved,
              isScrutinized,
              isAuthorized,
              vendorName,
              grossTotal,
              gst,
              NetAmount,
              POItems,
            },
          }
        );
      console.log(POUpdation);
      updateWorkflow
        ? res.send({ message: "PO sent for further Authorization !" })
        : res.status(401).send({ message: "Failed to send for authorizing" });
    } else
      res
        .status(401)
        .send({ message: "Please Check your Approval Status at First" });
  }
});

//remove from existing senders' workflow

workflow.put("/update/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { vendorName, grossTotal, gst, NetAmount } = req.body;
  console.log(id);
  const checkIdInsideDB = await client
    .db("capstone")
    .collection("workflow")
    .findOne({ _id: new ObjectId(id) });
  console.log(checkIdInsideDB);
  if (!checkIdInsideDB) res.status(401).send({ message: "Invalid ID number" });
  else {
    const updateDetailforSender = await client
      .db("capstone")
      .collection("workflow")
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: {
            workflow: { vendorName, grossTotal, gst, NetAmount },
          },
        }
      );
    console.log(updateDetailforSender);
    updateDetailforSender
      ? res.send({ message: "Updated in Senders' workflow" })
      : res
          .status(401)
          .send({ message: "failed to update in senders' workflow" });
  }
});

//GET ALL WORKFLOWS
workflow.get("/", auth, async (req, res) => {
  const getUserData = await client
    .db("capstone")
    .collection("workflow")
    .find({})
    .toArray();
  getUserData
    ? res.send(getUserData)
    : res.status(401).send({ message: "failed to load workflow details" });
});

workflow.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const getInventoryfromDB = await client
    .db("capstone")
    .collection("workflow")
    .findOne({ _id: new ObjectId(id) });
  console.log(getInventoryfromDB);
  getInventoryfromDB
    ? res.send(getInventoryfromDB)
    : res.status(401).send({ message: "failed to load the data" });
});

export default workflow;
