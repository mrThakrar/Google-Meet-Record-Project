const { DataTypes } = require("../../config/constant.js");
const { sequelize } = require("../../config/db.js");

const Calendar = sequelize.define("calendar", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
    },
    meetingId: {
        type: DataTypes.STRING,
    },
    startTime: {
        type: DataTypes.DATE,
    },
    endTime: {
        type: DataTypes.DATE,
    },
    summary: {
        type: DataTypes.STRING,
    },
    isCronScheduled: {
        type: DataTypes.BOOLEAN,
    },
});

(async () => {
    await sequelize.sync();
})();

module.exports = Calendar;
