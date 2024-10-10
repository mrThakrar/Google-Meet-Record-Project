const express = require("express");
const { cors } = require("./config/constant.js");
const Router = require("./config/routes/routes.js");

const app = express();
const port = process.env.PORT || 3000;

// ** global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ** routes
app.use(Router);

// ** start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

