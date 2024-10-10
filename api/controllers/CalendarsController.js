const { google, axios, cron, oauth2Client } = require("../../config/constant.js");
const Calendar = require("../models/Calendar.js");


const getEvents = async (req, res) => {
    try {
        const calendarId = req.query.calendarId ?? "primary";
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        calendar.events.list(
            {
                calendarId: calendarId,
                timeMin: new Date().toISOString(),

                maxResults: 15,
                singleEvents: true,
                orderBy: "startTime",
            },
            async (err, response) => {
                if (err) {
                    console.log(err);
                    return res.json({
                        success: false,
                        message: "Failed to get events",
                    });
                }
                const events = await response.data.items;
                console.log("events", events);

                for (let i = 0; i < events.length; i++) {
                    const event = events[i];
                    console.log("meeting link", event.hangoutLink);
                    const id = event.id;
                    const meetingId = event.hangoutLink;
                    const email = event?.creator?.email;
                    const start = event?.start?.dateTime;
                    const end = event?.end?.dateTime;
                    const summary = event?.summary;

                    console.log("123",start, end);

                    // ** check if event already exists
                    const existingEvent = await Calendar.findOne({ 
                        where: {
                            id: id,
                        }
                    });
                    if (existingEvent) {
                        continue;
                    }

                    const newEvent = new Calendar({
                        id: id,
                        meetingId: meetingId,
                        email: email,
                        startTime: start,
                        endTime: end,
                        summary: summary,
                        cron: false,
                    });
                    await newEvent.save();
                }




                const cronEvents = await Calendar.findAll({
                    where: {
                        cron: 0,
                    }
                });
                console.log("cronEvents", cronEvents);
        
                for (let i = 0; i < cronEvents.length; i++) {
                    const event = cronEvents[i];
                    // const startTime = event.startTime.toISOString();
                    const startTimeDB = event.startTime;
                    const utcTime = new Date(startTimeDB);
                    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000; // Offset for IST in milliseconds
                    const startTime = new Date(utcTime.getTime() + istOffset).toISOString();
                    const meetingId = event.meetingId;
                    console.log("startTime", startTime);
                    console.log("meetingId", meetingId);
                    
                    const cronTime =
                        startTime.split("T")[1].split(":")[1] +
                        " " +
                        startTime.split("T")[1].split(":")[0] +
                        " " +
                        startTime.split("T")[0].split("-")[2] +
                        " " +
                        startTime.split("T")[0].split("-")[1] +
                        " *";
                    console.log(cronTime);
                    cron.schedule(cronTime, async () => {
                        console.log("meetcron");
                        await axios.post(`http://localhost:3000/startRecording`, {
                            meetingId: meetingId,
                        });
                    });
                    event.cron = true;
                    await event.save();
                }
        
                return res.json({
                    success: true,
                    // events: events,
                });
            }
        );

    } catch (error) {
        console.log("error", error.message);
        console.log(error)
        return res.json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getEvents,
};
