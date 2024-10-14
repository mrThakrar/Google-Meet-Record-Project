const express = require("express");
const getEvents = require("../../api/controllers/CalendarsController.js");

const Router = express.Router();

Router.get('/', getEvents);

module.exports = Router