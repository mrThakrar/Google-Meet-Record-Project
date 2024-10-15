const express = require("express");
const recorder = require("./recorder.js");
const calendar = require("./calendar.js");
const { oauth2Client, google } = require("../constant.js");
const { fetchUserData } = require("../../api/controllers/UserController.js");

const Router = express.Router();

Router.use("/startRecording", recorder);
Router.use("/getEvents", calendar);

Router.get("/", (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/userinfo.email",
        ],
    });
    res.redirect(url);
});

// Router.get('/redirect', (req, res) => {
//     const code = req.query.code;
//     console.log(code);
//     oauth2Client.getToken(code, (err, token) => {
//         if(err) {
//             console.log(err);
//             return res.json({
//                 success: false,
//                 message: 'Failed to get access token'
//             })
//         }
//         oauth2Client.setCredentials(token);

//         return res.json({
//             success: true,
//             token: token
//         })
//     })
// })

Router.get("/redirect", fetchUserData);

module.exports = Router;
