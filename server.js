import { getFinalData } from "./index.js";
//const getFinalData = require("./index.mjs");

//import { express } from "express";
import express from "express";
const app = express();
const port = 4000;

try {
  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
} catch (error) {
  console.log(error);
}
