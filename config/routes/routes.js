const express = require("express");
const recorder = require("./recorder.js");
const calendar = require("./calendar.js");
const { oauth2Client } = require("../constant.js");

const Router = express.Router();

Router.use("/startRecording", recorder);
Router.use("/getEvents", calendar);

Router.get("/", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.readonly']
    })
    res.redirect(url);
});

Router.get('/redirect', (req, res) => {
    const code = req.query.code;
    console.log(code);
    oauth2Client.getToken(code, (err, token) => {
        if(err) {
            console.log(err);
            return res.json({
                success: false,
                message: 'Failed to get access token'
            })
        }
        oauth2Client.setCredentials(token);

        return res.json({
            success: true,
            token: token
        })
    })
})

// Router.get('/events', (req, res) => {
//     const calendarId = req.query.calendarId ?? 'primary';
//     const calendar = google.calendar({version: 'v3', auth: oauth2Client});

//     calendar.events.list({
//         calendarId: calendarId,
//         timeMin: new Date().toISOString(),
//         maxResults: 10,
//         singleEvents: true,
//         orderBy: 'startTime'
//     }, (err, response) => {
//         if(err) {
//             console.log(err);
//             return res.json({
//                 success: false,
//                 message: 'Failed to get events'
//             })
//         }
//         const events = response.data.items;

//         for (let i = 0; i < events.length; i++) {
//             const event = events[i];
//             console.log("meeting link", event.hangoutLink);
//         }
//         return res.json({
//             success: true,
//             events: events
//         })
//     })
// })

module.exports = Router;
