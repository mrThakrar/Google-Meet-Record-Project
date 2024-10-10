const { Sequelize } = require("./constant.js");
const { dotenv } = require("./constant.js");
dotenv.config();

const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "mysql",
        logging: false,
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
};

module.exports = {sequelize, connectDB};
