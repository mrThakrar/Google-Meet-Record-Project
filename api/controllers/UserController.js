const { oauth2Client, google } = require("../../config/constant.js");
const User = require("../models/User.js");

const fetchUserData = async (req, res) => {
    try {
        const code = req.query.code;
        console.log("Authorization Code:", code);

        // Get the token using the code from the query
        const {tokens} = await oauth2Client.getToken(code);

        // Set the credentials with the token
        oauth2Client.setCredentials(tokens);

        // Use the token to get user information
        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: "v2",
        });

        // Fetch user info
        const userInfo = await oauth2.userinfo.get();
        console.log("User Info:", userInfo.data);

        // Check if user already exists in the database
        const userFromDB = await User.findOne({ id: userInfo.data.id });
        if (userFromDB) {
            // User already exists so update the token
            userFromDB.googleToken = tokens;
            await userFromDB.save();
            return res.status(200).json({
                success: true,
                user: userFromDB,
            });
        }

        // Save user to the database (replace this with your DB logic)
        const user = await User.create({
            id: userInfo.data.id,
            email: userInfo.data.email,
            googleToken: tokens, // Store the token securely
        });

        // Return response with user info
        return res.status(200).json({
            success: true,
            user: user,
        });
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message, // More detailed error message
        });
    }
};

module.exports = {
    fetchUserData,
};
