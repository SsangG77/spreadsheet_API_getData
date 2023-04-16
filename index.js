const { google } = require("googleapis");
//import google from "googleapis";
//const getSharedSheetAsJson = require("./getSharedSheetAsJson.js");
//import getSharedSheetAsJson from "./getSharedSheetAsJson.js";

//import api_Key from "./apikey.json"
//const api_key = require('./apikey.json')
require("dotenv").config();
//import dotenv from "dotenv";
//dotenv.config();

let sheetName = "23년 4월";

// 예시: 공유된 스프레드시트 ID, 범위, API 키를 인자로 전달합니다.
getSharedSheetAsJson(sheetName).then((data) => {
  //let parseJson = JSON.parse(data);
  //console.log(data);
  console.log(data.length);
  // 0 2 4 6 8 = 날짜 데이터
  // 1 3 5 7 9 = 값 데이터
  let date_num = [];
  let detail_data = [];
  for (let i = 0; i < data.length; i++) {
    //i의 값이 홀수일때 값데이터이다
    if (i % 2 != 0) {
      //detail_data.push(data[i]);
      for (let j = 0; j < data[i].length; j++) {
        detail_data.push(data[i][j]);
      }
    } else {
      for (let j = 0; j < data[i].length; j++) {
        date_num.push(data[i][j]);
      }
    }
  }
  console.log(date_num);
  console.log(detail_data);
});

async function getSharedSheetAsJson(sheetName) {
  let sheetId = "1FOZdya-n8Rv2GMBOqecv_rOA8swGGLUJE6hA_LYv6wg"; //공유된 스프레드시트 ID
  let sheetRange = `${sheetName}!D3:AH16`; //스프레드시트 셀 범위
  let apiKey = process.env.API_KEY;

  console.log("====================================[ 함수 동작함 ] ====================================");
  try {
    const sheets = google.sheets("v4");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetRange,
      key: apiKey,
    });

    const rows = response.data.values;
    let total = [];

    for (let i = 0; i < rows.length; i++) {
      let row = [];
      let num = 0;

      //스프레드시트에서 가져온 데이터가 undefined일때 빈문자열('')로 변환하는 코드
      for (let j = 0; j < 7; j++) {
        if (rows[i][num] === undefined) {
          row.push("");
          num = num + 5;
        } else {
          row.push(rows[i][num]);
          num = num + 5;
        }
      }

      //빈배열 골라내는 if문
      if (i != 2 && i != 5 && i != 8 && i != 11) {
        total.push(row);
      }
    }
    //console.log(total);
    // const headers = rows[0];
    // const data = rows.slice(1);

    // const result = data.map((row) => {
    //   return headers.reduce((obj, header, idx) => {
    //     obj[header] = row[idx];
    //     return obj;
    //   }, {});
    // });

    //return JSON.stringify(result);
    return total;
  } catch (error) {
    console.error(error);
    return null;
  }
}
