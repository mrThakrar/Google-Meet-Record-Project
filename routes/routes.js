import express from "express";
import recorder from "./recorder.route.js";

const Router = express.Router();

Router.use("/startRecording", recorder);
Router.get("/", (req, res) => {
    return res.json({
        status: "success",
        message: "APIs for google meet recording"
    });
});

export default Router;