/**
 * Code in this module is taken largely from the Google API
 * documentation at https://developers.google.com/calendar/quickstart/nodejs
 * TODO: This should be rewritten once oAuth is properly understood!
 */

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

let eventList = [];

function GoogleCalendarAPI() {
}

GoogleCalendarAPI.prototype.getEventList = function () {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
  });
  return eventList;
};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * Credit: This function is taken from from the Google API
 * documentation at https://developers.google.com/calendar/quickstart/nodejs
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * Credit: This function is taken from from the Google API
 * documentation at https://developers.google.com/calendar/quickstart/nodejs
 *
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 5 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 *
 * Credit: This is a modified version of function taken from from the
 * Google API documentation at
 * https://developers.google.com/calendar/quickstart/nodejs
 */
function listEvents(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = res.data.items;
    if (events.length) {
      const newEventList = [];
      events.map((event, i) => {
        const eventStartDate = event.start.dateTime.slice(0,10);
        const eventStartTime = event.start.dateTime.slice(11,16);
        const eventEndTime = event.end.dateTime.slice(11, 16);
        const date = eventStartDate || 'no date available';
        const start = eventStartTime || event.start.date;
        const end = eventEndTime || 'no end time available';
        const eventTitle = event.summary || 'no title available';

        const totalEventTime = new EventTimes(date, start, end, eventTitle);

        newEventList.push(totalEventTime);
      });
      eventList = newEventList;
    } else {
      console.log('No upcoming events found.');
    }
  });
}

// ========== Event Constructor Object ========== //
function EventTimes(date, start, end, eventTitle) {
  this.date = date;
  this.start = start;
  this.end = end;
  this.eventTitle = eventTitle;
}

module.exports = GoogleCalendarAPI;
