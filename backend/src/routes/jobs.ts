import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: List all jobs
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get('/jobs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    });
    return res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Get job status and details
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 */
router.get('/jobs/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId as string;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { products: { select: { skuId: true, productTitle: true, qualityScore: true } } },
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    return res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
});

export default router;
