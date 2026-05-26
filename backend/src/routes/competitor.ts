import { Router, Request, Response, NextFunction } from 'express';
import { csvUpload } from '../middleware/upload-config';
import prisma from '../lib/prisma';
import { parseCompetitorCsv, generateMockPrices, getComparisonForProduct } from '../services/price-comparator';
import { generatePriceAlerts } from '../services/alert-engine';
import fs from 'fs';

const router = Router();

/**
 * @swagger
 * /api/competitor-prices/upload:
 *   post:
 *     summary: Upload competitor price CSV
 *     tags: [Competitor Prices]
 */
router.post('/competitor-prices/upload', csvUpload.single('csv'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file provided' });
    }

    const prices = await parseCompetitorCsv(req.file.path);

    let imported = 0;
    for (const price of prices) {
      const product = await prisma.product.findUnique({ where: { skuId: price.skuId } });
      if (product) {
        await prisma.competitorPrice.create({
          data: {
            skuId: price.skuId,
            productName: price.productName,
            platform: price.platform,
            competitorUrl: price.competitorUrl,
            competitorPrice: price.competitorPrice,
            currency: price.currency || 'INR',
            lastCheckedAt: price.lastCheckedAt ? new Date(price.lastCheckedAt) : new Date(),
          },
        });
        imported++;
      }
    }

    try { fs.unlinkSync(req.file.path); } catch { /* already deleted by parser */ }

    await generatePriceAlerts();

    return res.json({
      success: true,
      data: { message: `Imported ${imported} of ${prices.length} competitor prices`, count: imported },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/competitor-prices/refresh:
 *   post:
 *     summary: Refresh competitor prices (mock simulation)
 *     tags: [Competitor Prices]
 */
router.post('/competitor-prices/refresh', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { price: { not: null } },
      select: { skuId: true, productTitle: true, price: true },
    });

    let totalCreated = 0;
    for (const product of products) {
      if (!product.price) continue;
      const mockPrices = generateMockPrices(product.skuId, product.productTitle || '', product.price);
      for (const mp of mockPrices) {
        await prisma.competitorPrice.create({ data: mp });
        totalCreated++;
      }
    }

    await generatePriceAlerts();

    return res.json({
      success: true,
      data: { message: `Refreshed prices. Created ${totalCreated} competitor price entries.`, count: totalCreated },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{skuId}/competitor-prices:
 *   get:
 *     summary: Get competitor prices for a product with comparison
 *     tags: [Competitor Prices]
 */
router.get('/products/:skuId/competitor-prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skuId = req.params.skuId as string;
    const product = await prisma.product.findUnique({
      where: { skuId },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const competitorPrices = await prisma.competitorPrice.findMany({
      where: { skuId },
      orderBy: { lastCheckedAt: 'desc' },
    });

    const comparison = getComparisonForProduct(product.price, competitorPrices);

    return res.json({
      success: true,
      data: {
        ourPrice: product.price,
        competitorPrices,
        comparison,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/competitor-prices/all:
 *   get:
 *     summary: Get competitor price comparison for all products
 *     tags: [Competitor Prices]
 */
router.get('/competitor-prices/all', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { price: { not: null } },
      select: {
        skuId: true,
        productTitle: true,
        brand: true,
        category: true,
        price: true,
        mrp: true,
        competitorPrices: {
          orderBy: { lastCheckedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = products.map(product => {
      const comparison = getComparisonForProduct(product.price, product.competitorPrices);
      return {
        skuId: product.skuId,
        productTitle: product.productTitle,
        brand: product.brand,
        category: product.category,
        ourPrice: product.price,
        mrp: product.mrp,
        competitorPrices: product.competitorPrices,
        comparison,
      };
    });

    return res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products/{skuId}/price-history:
 *   get:
 *     summary: Get price history for a product (for charting)
 *     tags: [Competitor Prices]
 */
router.get('/products/:skuId/price-history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skuId = req.params.skuId as string;
    const product = await prisma.product.findUnique({ where: { skuId }, select: { price: true, productTitle: true } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const prices = await prisma.competitorPrice.findMany({
      where: { skuId },
      orderBy: { lastCheckedAt: 'asc' },
      select: { platform: true, competitorPrice: true, lastCheckedAt: true },
    });

    const dateMap = new Map<string, any>();
    for (const p of prices) {
      const dateKey = new Date(p.lastCheckedAt).toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: dateKey, ourPrice: product.price });
      }
      const entry = dateMap.get(dateKey);
      entry[p.platform] = p.competitorPrice;
    }

    const platforms = [...new Set(prices.map(p => p.platform))];
    const history = Array.from(dateMap.values());

    return res.json({ success: true, data: { history, platforms, ourPrice: product.price } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/competitor-prices/manual:
 *   post:
 *     summary: Manually add a competitor price entry
 *     tags: [Competitor Prices]
 */
router.post('/competitor-prices/manual', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skuId, platform, competitorPrice, competitorUrl, productName } = req.body;

    if (!skuId || !platform || !competitorPrice) {
      return res.status(400).json({ success: false, message: 'skuId, platform, and competitorPrice are required' });
    }

    const product = await prisma.product.findUnique({ where: { skuId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const entry = await prisma.competitorPrice.create({
      data: {
        skuId,
        platform,
        competitorPrice: parseFloat(competitorPrice),
        competitorUrl: competitorUrl || null,
        productName: productName || product.productTitle,
        lastCheckedAt: new Date(),
      },
    });

    await generatePriceAlerts();

    return res.json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
});

export default router;
