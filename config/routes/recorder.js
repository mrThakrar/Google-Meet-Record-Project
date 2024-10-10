const express = require('express');
const startRecording = require('../../api/controllers/RecordController.js');

const router = express.Router();

router.post('/', startRecording);

module.exports = router;