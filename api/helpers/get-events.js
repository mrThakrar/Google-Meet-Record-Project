const Calendar = require("../models/Calendar.js");
const { cron, google, oauth2Client } = require("../../config/constant.js");
const { meetRecorder } = require("./record-helper.js");

const getEventsAndScheduleCron = async () => {
    const calendarId = "primary";

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    return new Promise((resolve, reject) => {
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
                    return resolve({
                        success: false,
                        message: "Failed to get events",
                    });
                }

                try {
                    // ** events
                    const events = await response.data.items;
                    console.log("events", events);

                    // ** loop for checking if event already exists in db and if not then push into db
                    const eventArr = [];
                    for (let i = 0; i < events.length; i++) {
                        const event = events[i];
                        console.log("meeting link", event.hangoutLink);

                        // ** temp event object
                        const eventObj = {};
                        eventObj.id = event.id;
                        eventObj.meetingId = event.hangoutLink;
                        eventObj.email = event?.creator?.email;
                        eventObj.startTime = new Date(event?.start?.dateTime);
                        eventObj.endTime = new Date(event?.end?.dateTime);
                        eventObj.summary = event?.summary;
                        eventObj.isCronScheduled = false;

                        // ** check if event already exists
                        const existingEvent = await Calendar.findOne({
                            where: {
                                id: eventObj.id,
                            },
                        });
                        if (existingEvent) {
                            continue;
                        }

                        eventArr.push(eventObj);
                    }

                    // ** push eventArr to db
                    console.log("eventArr", eventArr);
                    if (eventArr.length > 0) {
                        await Calendar.bulkCreate(eventArr);
                    }

                    // ** finding even on which cron job needs to be scheduled
                    const cronEvents = await Calendar.findAll({
                        where: {
                            isCronScheduled: false,
                        },
                    });
                    console.log("cronEvents", cronEvents);

                    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000; // Offset for IST in milliseconds

                    // ** scheduling cron jobs on cronEvents
                    for (let i = 0; i < cronEvents.length; i++) {
                        const event = cronEvents[i];
                        // const startTime = event.startTime.toISOString();
                        // ** convert time to IST
                        const startTimeDB = event.startTime;
                        const utcTime = new Date(startTimeDB);
                        const startTime = new Date(
                            utcTime.getTime() + istOffset
                        ).toISOString();
                        const meetingId = event.meetingId;
                        console.log("startTime", startTime);
                        console.log("meetingId", meetingId);

                        // ** finding cron time
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

                        // ** schedule cron
                        cron.schedule(cronTime, async () => {
                            console.log("meetcron");
                            // await axios.post(`http://localhost:3000/startRecording`, {
                            //     meetingId: meetingId,
                            // });
                            await meetRecorder(meetingId);
                        });
                        event.isCronScheduled = true;
                        await event.save();
                    }

                    resolve({
                        success: true,
                        message:
                            "Events fetched and cron jobs scheduled successfully",
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        message: error.message,
                    });
                }
            }
        );
    });
};

module.exports = getEventsAndScheduleCron;
