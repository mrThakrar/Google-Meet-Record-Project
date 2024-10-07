import { Router } from 'express';
import { startRecording } from '../api/controllers/recorder.controller.js';

const router = Router();

router.post('/', startRecording);

export default router;