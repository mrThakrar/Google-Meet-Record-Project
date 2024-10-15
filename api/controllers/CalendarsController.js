const { google, axios, cron, oauth2Client } = require("../../config/constant.js");
const Calendar = require("../models/Calendar.js");
const getEventsAndScheduleCron = require("../helpers/get-events.js");


const getEvents = async (req, res) => {
    try {

        // ** fetching events
        const resp = await getEventsAndScheduleCron();
        console.log(resp);
        if (!resp.success) {
            return res.json({
                success: false,
                message: resp.message,
            });
        } else {
            return res.json({
                success: true,
                message: "Events fetched and cron jobs scheduled successfully",
            });
        }


    } catch (error) {
        console.log("error", error.message);
        console.log(error)
        return res.json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = getEvents;
