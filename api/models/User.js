const { DataTypes } = require("../../config/constant.js");
const { sequelize } = require("../../config/db.js");

const User = sequelize.define("user", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
    },
    googleToken: {
        type: DataTypes.JSON,
    },
});

(async () => {
    await sequelize.sync();
})()

module.exports = User;