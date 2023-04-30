import { promises as fs } from "fs";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import axios from "axios";

import { getSharedSheetAsJson } from "./getFinalData.js";
import { getAfter } from "./getFinalData.js";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let auth_obj = {
    client: "",
    a: "a",
  };

  auth_obj.client = await loadSavedCredentialsIfExist();
  if (auth_obj.client) {
    return auth_obj;
  }
  auth_obj.client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (auth_obj.client.credentials) {
    await saveCredentials(auth_obj.client);
  }
  return auth_obj;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

async function processing(auth_obj) {
  console.log("====동작함====");
  let auth = auth_obj.client;

  let event_list;

  listEvents(auth).then((li) => {
    event_list = li;
  });

  let spread_list = [];
  //axios.get("https://schedule-ing.vercel.app/api/schedules/this-month")

  let sheetName = process.env.SHEET_NAME;
  getSharedSheetAsJson(sheetName)
    .then(getAfter)
    .then((res) => {
      //let data = res.data.schedules; //스케줄 배열
      let data = res;
      //console.log(data);

      let year = new Date().getFullYear().toString(); //년도 숫자값
      let month = getMonth(); //이번달 숫자값

      data.map((summary, i) => {
        let days;
        let num = i + 1; //스케줄 배열의 인덱스 값에 1을 더해서 일 숫자값으로 초기화
        let final_summary;

        if (summary == "") {
          final_summary = summary;
        } else if (summary.includes("휴방")) {
          final_summary = summary;
        } else {
          final_summary = "😜" + summary;
        }

        //num이 한자리일때는 앞에 0을 더하고 아니면 그냥 days에 값 입력
        if (num < 10) {
          days = "0" + num.toString();
        } else {
          days = num.toString();
        }

        // summary는 스케줄의 한 데이터
        let obj = {
          type: "스프레드 시트",
          summary: final_summary,
          start: `${year}-${month}-${days}`,
          end: `${year}-${month}-${days}`,
        };
        spread_list.push(obj);
      });
    });

  setTimeout(() => {
    for (let i in spread_list) {
      let spreadsheet_date = spread_list[i].start.toString(); //스프레드시트 인덱스의 날짜가 나옴
      let days = parseInt(spreadsheet_date.slice(-2)); //몇일인지 숫자 값으로 나옴

      setTimeout(() => {
        if (days <= 31) {
          checkEventExist(auth, spreadsheet_date).then((result) => {
            //날짜값과 일치하는 날짜의 이벤트가 있는지 확인

            //해당 날짜에 이벤트가 있다. 없다.
            let res;
            if (result.length == 0) {
              res = false;
            } else {
              res = true;
            }

            if (res) {
              //console.log("이 날짜에는 이벤트가 존재합니다.");

              //summary가 같은지 확인한다.
              let spread_summary = spread_list[i].summary;
              let event_summary = result[0].summary;
              if (spread_summary === event_summary) {
              } else {
                if (spread_summary === "" || spread_summary === undefined) {
                  //해당 날짜의 이벤트를 삭제하기
                  let date = spread_list[i].start;
                  console.log(date);
                  const calendar = google.calendar({ version: "v3", auth });

                  calendar.events
                    .list({
                      calendarId: "primary",
                      timeMin: `${date}T00:00:00Z`,
                      timeMax: `${date}T23:59:59Z`,
                    })
                    .then(function (response) {
                      var events = response.data.items;
                      for (var i = 0; i < events.length; i++) {
                        var event = events[i];
                        calendar.events
                          .delete({
                            calendarId: "primary",
                            eventId: event.id,
                          })
                          .then(
                            function (response) {
                              console.log("Event deleted: " + event.summary);
                            },
                            function (error) {
                              console.error("Error deleting event: " + error);
                            }
                          );
                      }
                    });
                } else {
                  //같지 않을 경우
                  let obj = {
                    start: spread_list[i].start,
                    eventId: result[0].id,
                  };
                  updateEvent(auth, obj, spread_list[i].summary);
                }
                ``;
              }
            } else {
              //console.log("이 날짜에는 이벤트가 존재하지 않습니다.");
              let obj = {
                date: spread_list[i].start,
                summary: spread_list[i].summary,
              };
              if (spread_list[i].summary !== "") {
                addEvent(auth, obj);
              }
            }
          });
        }
      }, i * 1000);
    }
  }, 40000);
}
console.log("=================================================================================================");
let num = 1;
setInterval(() => {
  try {
    authorize().then(processing).catch(console.error);
    console.log(num);
    num++;
    var today = new Date();

    var hours = ("0" + today.getHours()).slice(-2);
    var minutes = ("0" + today.getMinutes()).slice(-2);
    var seconds = ("0" + today.getSeconds()).slice(-2);

    var timeString = hours + ":" + minutes + ":" + seconds;

    console.log(timeString);
  } catch (error) {
    console.log(error);
  }
}, 60000);

//====================================================================//====================================================================
//====================================================================//====================================================================

async function listEvents(auth) {
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date("2023-02-01").toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = res.data.items;
  let event_arr = [];
  if (!events || events.length === 0) {
    console.log("No upcoming events found.");
    return event_arr;
  }

  events.map((event, i) => {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;
    const summary = event.summary;
    const eventId = event.id;
    let obj = {
      type: "구글 이벤트",
      start: start,
      end: end,
      summary: summary,
      eventId: eventId,
    };
    event_arr.push(obj);
  });
  return event_arr;
}

async function checkEventExist(auth, date) {
  //date는 '2023-02-01' 이런 형식이어야 함.

  const calendar = google.calendar({ version: "v3", auth });

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
  });

  const events = response.data.items;
  return events;
}

function getMonth() {
  let month_ = new Date().getMonth() + 1;
  if (month_.toString().length == 1) {
    return "0" + month_.toString();
  } else {
    return month_;
  }
}

async function addEvent(auth, obj) {
  const calendar = google.calendar({ version: "v3", auth });

  let date = obj.date;
  let summary = obj.summary;

  const eventDate = new Date(date);

  const event = {
    summary: summary,
    start: {
      date: eventDate.toISOString().slice(0, 10),
      timeZone: "Asia/Seoul",
    },
    end: {
      date: eventDate.toISOString().slice(0, 10),
      timeZone: "Asia/Seoul",
    },
    allDay: true,
  };

  calendar.events.insert(
    {
      auth: auth,
      calendarId: "primary",
      resource: event,
    },
    function (err, event) {
      if (err) {
        console.log("There was an error contacting the Calendar service: " + err);
        return;
      }
      console.log("Event created: %s", event.data.summary);
    }
  );
}

async function updateEvent(auth, obj, get_summary) {
  console.log("============== updateEvent : 동작 ==================");
  const calendar = google.calendar({ version: "v3", auth });

  let date = obj.start;
  let summary = get_summary;
  const eventDate = new Date(date);

  const event = {
    summary: `${summary}`,
    start: {
      date: eventDate.toISOString().slice(0, 10),
      timeZone: "Asia/Seoul",
    },
    end: {
      date: eventDate.toISOString().slice(0, 10),
      timeZone: "Asia/Seoul",
    },
    // allDay 속성 추가
    allDay: true,
  };

  await calendar.events.update({
    calendarId: "primary",
    eventId: obj.eventId,
    resource: event,
  });
}
