import { executablePath } from "puppeteer";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import anonymizeUaPlugin from "puppeteer-extra-plugin-anonymize-ua";
import { launch, getStream } from "puppeteer-stream";
import path from "path";
import createHttpError from "http-errors";
import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from 'url';
import fs from "fs";

// puppeteerExtra.use(stealthPlugin());
// puppeteerExtra.use(anonymizeUaPlugin());

// ** sleep function
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ** generate file name
const generateFileName = () => {
    const timestamp = new Date().toISOString();
    return `google_meet_${timestamp}.webm`;
};

export const startRecording = async (req, res) => {
    try {
        const { meetingId } = req.body;

        if (!meetingId) {
            throw createHttpError.BadRequest("Meeting ID is required");
        }

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
        await page.goto(`https://meet.google.com/${meetingId}`, {
            timeout: 30000,
            waitUntil: "networkidle0",
        });

        await sleep(5000);

        // ** entering meeting id
        await page.waitForSelector('input[type="text"]', { visible: true });
        await page.click('input[type="text"]');
        await sleep(2000);
        await page.keyboard.type("123", { delay: 200 });
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

        // ** Create a __dirname equivalent
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // ** Create a write stream to save the video
        const recordingsDir = path.join(__dirname, "../../recordings");
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }

        const uniqueFileName = generateFileName();
        const fileStream = fs.createWriteStream(
            path.join(recordingsDir, uniqueFileName)
        );
        stream.pipe(fileStream);
        console.log("Recording started...");

        const monitorMeetingEnd = async () => {
            await page.waitForSelector('[aria-label="Leave call"]', {
                visible: true,
            });
            while (true) {
                await sleep(5000);

                // ** Check if the "Leave call" button is no longer present
                const isMeetingEnded = await page.evaluate(() => {
                    const leaveButton = document.querySelector(
                        '[aria-label="Leave call"]'
                    );
                    console.log("leaveButton", leaveButton);
                    // return !leaveButton;

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

        process.on("SIGINT", () => {
            console.log(
                "Received SIGINT. Saving and stopping the recording..."
            );
            stopRecording();
            process.exit();
        });

        process.on("SIGTERM", () => {
            console.log(
                "Received SIGTERM. Saving and stopping the recording..."
            );
            stopRecording();
            process.exit();
        });

        process.on("uncaughtException", (err) => {
            console.error("Uncaught exception:", err);
            stopRecording();
            process.exit(1);
        });

        await monitorMeetingEnd();

        // ** Stop the recording
        // stream.destroy();
        // fileStream.end();
        stopRecording();

        console.log("Recording saved as google_meet_recording.webm");

        await browser.close();

        return {
            success: true,
            message: "Recording saved",
        };
    } catch (error) {
        console.log(error);

        return {
            success: false,
            message: "Recording failed",
        };
    }
};
