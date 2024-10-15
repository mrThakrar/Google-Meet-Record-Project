// const { timeout } = require("puppeteer");
// const {
//     executablePath,
//     puppeteerExtra,
//     stealthPlugin,
//     anonymizeUaPlugin,
//     launch,
//     getStream,
//     path,
//     createHttpError,
//     dotenv,
//     fs,
// } = require("../../config/constant");
// dotenv.config();

const { meetRecorder } = require("../helpers/record-helper.js");

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
    const resp = await meetRecorder(meetingId);
    if (resp.success) {
      return res.status(200).json({
        success: true,
        message: "Recording saved",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Recording failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
};

module.exports = startRecording;
