const {axios, cron} = require("./constant.js");

const scheduleCron = async () => {
    console.log("dcsd")
    cron.schedule('*/10 * * * *', async() => {
        console.log("vfv")
        await axios.get('http://localhost:3000/getEvents');
    })
    console.log("Cron job scheduled");
}

module.exports = {
    scheduleCron
}
