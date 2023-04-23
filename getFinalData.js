import { google } from "googleapis";
//const google = require("googleapis");

import dotenv from "dotenv";
//const dotenv = require("dotenv");
dotenv.config();

// 예시: 공유된 스프레드시트 ID, 범위, API 키를 인자로 전달합니다.
//getFinalData();
export async function getFinalData() {
  getSharedSheetAsJson(sheetName).then(getAfter);
}

export function getAfter(data) {
  let date_num = [];
  let detail_data = [];
  for (let i = 0; i < data.length; i++) {
    //i의 값이 홀수일때 값데이터이다
    if (i % 2 != 0) {
      for (let j = 0; j < data[i].length; j++) {
        detail_data.push(data[i][j]);
      }
    } else {
      for (let j = 0; j < data[i].length; j++) {
        date_num.push(data[i][j]);
      }
    }
  }

  for (let i = 0; i < date_num.length; i++) {
    if (date_num[i] == "1") {
      break;
    } else {
      detail_data = detail_data.slice(1);
    }
  }
  //console.log(detail_data);
  return detail_data;
}

export async function getSharedSheetAsJson(sheetName) {
  let sheetId = "1FOZdya-n8Rv2GMBOqecv_rOA8swGGLUJE6hA_LYv6wg"; //공유된 스프레드시트 ID
  let sheetRange = `${sheetName}!D3:AH16`; //스프레드시트 셀 범위
  let apiKey = process.env.API_KEY;

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
    return total;
  } catch (error) {
    console.error(error);
    return null;
  }
}
