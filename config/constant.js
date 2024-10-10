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
    createHttpError
};
