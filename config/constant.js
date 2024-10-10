const { executablePath } = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const anonymizeUaPlugin = require("puppeteer-extra-plugin-anonymize-ua");
const { launch, getStream } = require("puppeteer-stream");
const path = require("path");
const createHttpError = require("http-errors");
const dotenv = require("dotenv");
const { fileURLToPath } = require("url");
const fs = require("fs");
const cors = require("cors");
const { google } = require("googleapis");
const { Sequelize, DataTypes } = require("sequelize");
const cron = require("node-cron");
const axios = require("axios");

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENNT_ID,
    process.env.SECRET_ID,
    process.env.REDIRECT_URI
)

module.exports = {
    executablePath,
    puppeteerExtra,
    stealthPlugin,
    anonymizeUaPlugin,
    launch,
    getStream,
    path,
    createHttpError,
    dotenv,
    fileURLToPath,
    fs,
    cors,
    google,
    oauth2Client,
    Sequelize,
    DataTypes,
    cron,
    axios,
};
