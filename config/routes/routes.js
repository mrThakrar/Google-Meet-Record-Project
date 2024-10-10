const express = require("express");
const recorder = require("./recorder.js");

const Router = express.Router();

Router.use("/startRecording", recorder);
Router.get("/", (req, res) => {
    return res.json({
        status: "success",
        message: "APIs for google meet recording"
    });
});

module.exports = Router;