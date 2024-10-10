const express = require("express");
const { cors } = require("./config/constant.js");
const Router = require("./config/routes/routes.js");
const { connectDB } = require("./config/db.js");
const { scheduleCron } = require("./config/cron.js");

const app = express();
const port = process.env.PORT || 3000;

// ** global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ** database connection
connectDB();

// ** routes
app.use(Router);

// ** cron job
scheduleCron();

// ** start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

