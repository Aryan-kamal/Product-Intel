import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @swagger
 * /api/dashboard/quality-summary:
 *   get:
 *     summary: Get quality dashboard summary metrics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
router.get('/dashboard/quality-summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalProducts,
      highIssues,
      mediumIssues,
      lowIssues,
      avgScore,
      missingImageCount,
      invalidPriceCount,
      outOfStockCount,
      issuesByType,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.productIssue.count({ where: { severity: 'HIGH' } }),
      prisma.productIssue.count({ where: { severity: 'MEDIUM' } }),
      prisma.productIssue.count({ where: { severity: 'LOW' } }),
      prisma.product.aggregate({ _avg: { qualityScore: true } }),
      prisma.productIssue.count({ where: { issueType: 'MISSING_IMAGE' } }),
      prisma.productIssue.count({ where: { issueType: { in: ['INVALID_PRICE', 'MRP_LOWER_THAN_PRICE'] } } }),
      prisma.product.count({ where: { availability: 'out_of_stock' } }),
      prisma.productIssue.groupBy({
        by: ['issueType'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const weakListings = await prisma.product.count({
      where: { qualityScore: { lte: 50 } },
    });

    return res.json({
      success: true,
      data: {
        totalProducts,
        issuesBySeverity: { HIGH: highIssues, MEDIUM: mediumIssues, LOW: lowIssues },
        averageQualityScore: Math.round(avgScore._avg.qualityScore || 0),
        weakListings,
        missingImageCount,
        invalidPriceCount,
        outOfStockCount,
        issuesByType: issuesByType.map(i => ({ type: i.issueType, count: i._count.id })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/dashboard/quality-report:
 *   get:
 *     summary: Download product quality report as CSV
 *     tags: [Dashboard]
 */
router.get('/dashboard/quality-report', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        issues: true,
        competitorPrices: { orderBy: { lastCheckedAt: 'desc' } },
      },
      orderBy: { qualityScore: 'asc' },
    });

    const rows: string[] = [];
    rows.push([
      'SKU ID', 'Product Title', 'Brand', 'Category', 'Price', 'MRP',
      'Quality Score', 'Availability', 'Issue Count', 'High Issues', 'Medium Issues', 'Low Issues',
      'Issues Summary', 'Enhanced Title', 'Competitor Count',
      'Lowest Competitor Price', 'Highest Competitor Price', 'Recommendation',
    ].join(','));

    for (const p of products) {
      const highCount = p.issues.filter(i => i.severity === 'HIGH').length;
      const medCount = p.issues.filter(i => i.severity === 'MEDIUM').length;
      const lowCount = p.issues.filter(i => i.severity === 'LOW').length;
      const issuesSummary = p.issues.map(i => `${i.severity}: ${i.issueType}`).join('; ');

      const cPrices = p.competitorPrices.map(c => c.competitorPrice);
      const lowestComp = cPrices.length > 0 ? Math.min(...cPrices) : '';
      const highestComp = cPrices.length > 0 ? Math.max(...cPrices) : '';

      let recommendation = '';
      if (p.price && cPrices.length > 0) {
        const lowest = Math.min(...cPrices);
        const gap = p.price - lowest;
        const pct = Math.round((gap / p.price) * 100);
        if (pct > 10) recommendation = `Overpriced by ${pct}% vs lowest competitor`;
        else if (gap <= 0) recommendation = 'Price is competitive';
        else recommendation = `Within ${pct}% of lowest competitor`;
      }

      const esc = (v: any) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      };

      rows.push([
        esc(p.skuId), esc(p.productTitle), esc(p.brand), esc(p.category),
        p.price ?? '', p.mrp ?? '', p.qualityScore, esc(p.availability),
        p.issues.length, highCount, medCount, lowCount,
        esc(issuesSummary), esc(p.enhancedTitle), p.competitorPrices.length,
        lowestComp, highestComp, esc(recommendation),
      ].join(','));
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=quality-report-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
});

export default router;
