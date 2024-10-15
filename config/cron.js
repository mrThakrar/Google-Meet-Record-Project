const {axios, cron} = require("./constant.js");
const getEventsAndScheduleCron = require("../api/helpers/get-events.js");

const scheduleCron = async () => {
    console.log("dcsd")
    cron.schedule('*/30 * * * * *', async() => {
        console.log("vfv")
        // await axios.get('http://localhost:3000/getEvents');
        await getEventsAndScheduleCron();
    })
    console.log("Cron job scheduled");
}

module.exports = {
    scheduleCron
}
