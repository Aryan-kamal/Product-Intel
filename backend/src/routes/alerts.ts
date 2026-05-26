import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: List alerts with optional filters
 *     tags: [Alerts]
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [HIGH, MEDIUM, LOW]
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of alerts
 */
router.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const severity = req.query.severity as string | undefined;
    const isRead = req.query.isRead as string | undefined;
    const where: any = {};

    if (severity) where.severity = severity;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { skuId: true, productTitle: true } } },
      take: 100,
    });

    const unreadCount = await prisma.alert.count({ where: { isRead: false } });

    return res.json({ success: true, data: { alerts, unreadCount } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/alerts/{alertId}/read:
 *   patch:
 *     summary: Mark alert as read
 *     tags: [Alerts]
 */
router.patch('/alerts/:alertId/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertId = req.params.alertId as string;
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
    return res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/alerts/mark-all-read:
 *   patch:
 *     summary: Mark all alerts as read
 *     tags: [Alerts]
 */
router.patch('/alerts/mark-all-read', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } });
    return res.json({ success: true, data: { message: 'All alerts marked as read' } });
  } catch (error) {
    next(error);
  }
});

export default router;
