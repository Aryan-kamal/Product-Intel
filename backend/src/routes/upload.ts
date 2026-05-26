import { Router, Request, Response, NextFunction } from 'express';
import { videoUpload, csvUpload } from '../middleware/upload-config';
import { processVideo } from '../services/video-processor';
import { processCsv } from '../services/csv-processor';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @swagger
 * /api/upload-video:
 *   post:
 *     summary: Upload a product video for processing
 *     tags: [Upload]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               enhanceTitle:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Job created successfully
 */
router.post('/upload-video', videoUpload.single('video'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const enhanceTitle = req.body.enhanceTitle === 'true' || req.body.enhanceTitle === true;

    const job = await prisma.job.create({
      data: {
        type: 'VIDEO',
        status: 'PENDING',
        progress: 0,
        enhanceTitle,
        fileName: req.file.originalname,
      },
    });

    processVideo(job.id, req.file.path, enhanceTitle);

    return res.json({
      success: true,
      data: { jobId: job.id, status: job.status, message: 'Video uploaded. Processing started.' },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/upload-products-csv:
 *   post:
 *     summary: Upload a product CSV file
 *     tags: [Upload]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *                 format: binary
 *               enhanceTitle:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Job created successfully
 */
router.post('/upload-products-csv', csvUpload.single('csv'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file provided' });
    }

    const enhanceTitle = req.body.enhanceTitle === 'true' || req.body.enhanceTitle === true;

    const job = await prisma.job.create({
      data: {
        type: 'CSV',
        status: 'PENDING',
        progress: 0,
        enhanceTitle,
        fileName: req.file.originalname,
      },
    });

    processCsv(job.id, req.file.path, enhanceTitle);

    return res.json({
      success: true,
      data: { jobId: job.id, status: job.status, message: 'CSV uploaded. Processing started.' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
