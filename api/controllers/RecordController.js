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

// ** puppeteer-extra plugins
// puppeteerExtra.use(stealthPlugin());
// puppeteerExtra.use(anonymizeUaPlugin());

// ** sleep function
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ** generate file name
const generateFileName = () => {
    const timestamp = new Date().toISOString();
    return `google_meet_${timestamp}.webm`;
};

// ** start recording
const startRecording = async (req, res) => {
    try {
        const { meetingId } = req.body;

        // ** validate meeting id
        if (!meetingId) {
            throw createHttpError.BadRequest("Meeting ID is required");
        }
        let meetId = "";
        if (meetingId.includes("https://meet.google.com/")) {
            const url = new URL(meetingId);
            meetId = meetingId.split("/")[3];
        } else {
            meetId = meetingId;
        }
        console.log("meetId", meetId);

        // ** browser launch
        const browser = await launch(puppeteerExtra, {
            // defaultViewport: {
            //     width: 1180,
            //     height: 950,
            // },
            headless: false,
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

        // ** go to google meet
        await page.goto(`https://meet.google.com/${meetId}`, {
            timeout: 30000,
            waitUntil: "networkidle0",
        });

        await sleep(5000);

        // ** entering bot name
        await page.waitForSelector('input[type="text"]', { visible: true });
        await page.click('input[type="text"]');
        await sleep(2000);
        await page.keyboard.type(process.env.Bot_Name ?? "MyBot", { delay: 200 });
        await sleep(2000);
        await page.keyboard.press("Enter");

        await sleep(5000);

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
        try {
            await page.waitForSelector('[aria-label="Leave call"]', {
                visible: true,
                timeout: 60000,
            });
        } catch (error) {
            console.log("Error:", error.message);
            await browser.close();
            return res.status(500).json({
                success: "false",
                message: "bot is not connected to meet",
            });
        }

        // ** Create a write stream to save the video
        const uniqueFileName = generateFileName();
        const fileStream = fs.createWriteStream(
            path.join(recordingsDir, uniqueFileName)
        );
        stream.pipe(fileStream);
        console.log("Recording started...");

        const monitorMeetingEnd = async () => {
            while (true) {
                await sleep(5000);

                try {
                    // ** Check if the "Leave call" button is no longer present
                    const isMeetingEnded = await page.evaluate(() => {
                        const leaveButton = document.querySelector(
                            '[aria-label="Leave call"]',
                        );
                        console.log("leaveButton", leaveButton);
    
                        let totalParticipants = 0;
    
                        let participantCount = document.querySelector(
                            ".gFyGKf.BN1Lfc .uGOf1d"
                        ).textContent;
                        participantCount = Number(participantCount);
                        totalParticipants = participantCount || 0;
                        console.log(`Number of participants: ${participantCount}`);
    
                        return totalParticipants < 2 || !leaveButton;
                    });
    
                    if (isMeetingEnded) {
                        console.log("Meeting has ended, stopping the recording...");
                        break;
                    }
                } catch (error) {
                    stopRecording();
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

        // ** Handle SIGINT
        process.on("SIGINT", () => {
            console.log(
                "Received SIGINT. Saving and stopping the recording..."
            );
            stopRecording();
            process.exit();
        });

        // ** Handle SIGTERM
        process.on("SIGTERM", () => {
            console.log(
                "Received SIGTERM. Saving and stopping the recording..."
            );
            stopRecording();
            process.exit();
        });

        // ** Handle uncaught exceptions
        process.on("uncaughtException", (err) => {
            console.error("Uncaught exception:", err);
            stopRecording();
            process.exit(1);
        });

        // ** Monitor the meeting end
        await monitorMeetingEnd();

        // ** Stop the recording
        stopRecording();

        // ** Close the browser
        await browser.close();
        console.log("browser closed");
        
        return res.status(200).json({
            success: true,
            message: "Recording saved",
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Recording failed",
        });
    }
};

module.exports = startRecording;