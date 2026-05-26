import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { enhanceProductTitle } from '../services/title-enhancer';

const router = Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all products with filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [HIGH, MEDIUM, LOW]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Paginated list of products
 */
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const severity = req.query.severity as string | undefined;
    const category = req.query.category as string | undefined;
    const brand = req.query.brand as string | undefined;
    const availability = req.query.availability as string | undefined;
    const search = req.query.search as string | undefined;
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '10';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const where: any = {};

    if (category) where.category = { equals: category as string, mode: 'insensitive' };
    if (brand) where.brand = { equals: brand as string, mode: 'insensitive' };
    if (availability) where.availability = availability as string;
    if (search) {
      where.OR = [
        { productTitle: { contains: search as string, mode: 'insensitive' } },
        { skuId: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (severity) {
      where.issues = { some: { severity: severity as string } };
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const orderBy: any = {};
    const validSortFields = ['createdAt', 'qualityScore', 'price', 'productTitle'];
    const field = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    orderBy[field] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          issues: { select: { severity: true, issueType: true } },
          _count: { select: { alerts: true, competitorPrices: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{skuId}:
 *   get:
 *     summary: Get product details
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: skuId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details with issues and competitor prices
 */
router.get('/products/:skuId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skuId = req.params.skuId as string;
    const product = await prisma.product.findUnique({
      where: { skuId },
      include: {
        issues: true,
        competitorPrices: { orderBy: { lastCheckedAt: 'desc' } },
        alerts: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{skuId}/enhance-title:
 *   post:
 *     summary: Generate enhanced title for a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: skuId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enhanced title result
 */
router.post('/products/:skuId/enhance-title', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skuId = req.params.skuId as string;
    const product = await prisma.product.findUnique({ where: { skuId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const result = enhanceProductTitle(product);

    await prisma.product.update({
      where: { skuId },
      data: { enhancedTitle: result.enhancedTitle },
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{skuId}/issues:
 *   get:
 *     summary: Get issues for a product
 *     tags: [Products]
 */
router.get('/products/:skuId/issues', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skuId = req.params.skuId as string;
    const issues = await prisma.productIssue.findMany({
      where: { skuId },
      orderBy: { severity: 'asc' },
    });
    return res.json({ success: true, data: issues });
  } catch (error) {
    next(error);
  }
});

export default router;
