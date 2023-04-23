//const getFinalData = require("./getFinalData.js");

import { getAfter } from "./getFinalData.js";
//const getAfter = require("./getFinalData.js");

import { getSharedSheetAsJson } from "./getFinalData.js";
//const getSharedSheetAsJson = require("./getSharedSheetAsJson.js");

//getFinalData();

let sheetName = "23년 4월";
getSharedSheetAsJson(sheetName)
  .then(getAfter)
  .then((a) => {
    console.log(a);
  });
