const {
    executablePath,
    puppeteerExtra,
    stealthPlugin,
    anonymizeUaPlugin,
    launch,
    getStream,
    path,
    createHttpError,
    dotenv,
    fs,
} = require("../../config/constant");
dotenv.config();

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const generateFileName = () => {
    const timestamp = new Date().toISOString();
    return `google_meet_${timestamp}.webm`;
};

const extractMeetingId = (meetingId) => {
    let meetId = "";
    if (meetingId.includes("https://meet.google.com/")) {
        const url = new URL(meetingId);
        meetId = meetingId.split("/")[3];
    } else {
        meetId = meetingId;
    }
    return meetId;
};

const joinGoogleMeet = async (page, meetId) => {
    await page.goto(`https://meet.google.com/${meetId}`, {
        timeout: 30000,
        waitUntil: "networkidle0",
    });

    await sleep(5000);
    await page.waitForSelector('input[type="text"]', { visible: true });
    await page.click('input[type="text"]');
    await sleep(2000);
    await page.keyboard.type(process.env.Bot_Name ?? "MyBot", { delay: 200 });
    await sleep(2000);
    await page.keyboard.press("Enter");
    await sleep(5000);
};

const meetRecorder = async(meetingId) => {
    let browser;
    try {

        // ** validate meeting id
        if (!meetingId) {
            throw createHttpError.BadRequest("Meeting ID is required");
        }

        // ** extract meeting id
        let meetId = extractMeetingId(meetingId);
        console.log("meetId", meetId);

        await sleep(2000);

        // ** browser launch
        browser = await launch(puppeteerExtra, {
            // defaultViewport: {
            //     width: 1180,
            //     height: 950,
            // },
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                // "--headless=new",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
            executablePath: executablePath(),
        });

        // ** override permissions
        const context = browser.defaultBrowserContext();
        await context.overridePermissions("https://meet.google.com/", [
            "microphone",
            "camera",
            "notifications",
        ]);

        const page = await context.newPage();

        // ** join the google meet
        await joinGoogleMeet(page, meetId);

        // ** stream config
        const stream = await getStream(page, {
            audio: true,
            video: false,
            bitsPerSecond: 128000,
            mimeType: "audio/webm;codecs=opus",
            frameSize: 2000,
        });

        // ** Create a directory to save the recordings
        const recordingsDir = path.join(__dirname, "..", "..", "recordings");
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }

        // ** Wait for bot to join
        await sleep(2000);

        // ** Create a write stream to save the video
        const uniqueFileName = generateFileName();
        const fileStream = fs.createWriteStream(
            path.join(recordingsDir, uniqueFileName)
        );

        // ** Monitor meeting end
        const monitorMeetingEnd = async () => {
            await page.waitForSelector('[aria-label="Leave call"]', {
                visible: true,
            });

            // ** Write the stream to the file
            stream.pipe(fileStream);
            console.log("Recording started...");
            while (true) {

                // ** Check if the "Leave call" button is no longer present
                const isMeetingEnded = await page.evaluate(() => {
                    const leaveButton = document.querySelector(
                        '[aria-label="Leave call"]'
                    );
                    console.log("leaveButton", leaveButton);

                    let totalParticipants = 0;

                    // ** Get the number of participants
                    let participantCount = document.querySelector(
                        ".gFyGKf.BN1Lfc .uGOf1d"
                    ).innerHTML;
                    participantCount = Number(participantCount);
                    totalParticipants = participantCount || 0;
                    console.log(`Number of participants: ${participantCount}`);

                    return totalParticipants < 2 || !leaveButton;
                });

                if (isMeetingEnded) {
                    console.log("Meeting has ended, stopping the recording...");
                    break;
                }
            }
        };

        // ** Stop the recording and close the file stream cleanly
        const stopRecording = () => {
            console.log("Stopping the recording...");
            if (stream && !stream.destroyed) {
                stream.destroy();
            }
            if (fileStream && !fileStream.closed) {
                fileStream.end();
            }
            console.log(`Recording saved as ${uniqueFileName}`);
        };

        // ** Monitor the meeting end
        await monitorMeetingEnd();

        // ** Stop the recording
        stopRecording();

        // ** Close the browser
        if (browser) {
            await browser.close();
        }
        console.log("browser closed");

        return {
            success: true,
            status: 200,
            message: "Recording saved",
        };
    } catch (error) {
        console.log(error);

        // ** Close the browser
        if (browser) {
            console.log(browser);
            await browser.close();
        }

        return {
            success: false,
            status: 500,
            message: "Recording failed",
        };
    } finally {
        console.log("finally executed");
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { sleep, generateFileName, extractMeetingId, joinGoogleMeet, meetRecorder };