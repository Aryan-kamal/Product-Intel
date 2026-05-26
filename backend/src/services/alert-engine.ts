import prisma from '../lib/prisma';
import { Severity } from '@prisma/client';

interface AlertInput {
  skuId: string | null;
  type: string;
  severity: Severity;
  message: string;
}

export async function generateAlertsForProduct(skuId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { skuId },
    include: { issues: true },
  });

  if (!product) return;

  const alerts: AlertInput[] = [];

  const highIssues = product.issues.filter(i => i.severity === 'HIGH');
  const mediumIssues = product.issues.filter(i => i.severity === 'MEDIUM');
  const lowIssues = product.issues.filter(i => i.severity === 'LOW');

  for (const issue of highIssues) {
    alerts.push({
      skuId,
      type: issue.issueType,
      severity: 'HIGH',
      message: `[${product.productTitle || skuId}] ${issue.message}`,
    });
  }

  if (mediumIssues.length > 0) {
    alerts.push({
      skuId,
      type: 'QUALITY_ISSUES',
      severity: 'MEDIUM',
      message: `[${product.productTitle || skuId}] Has ${mediumIssues.length} medium-severity issue(s): ${mediumIssues.map(i => i.issueType).join(', ')}`,
    });
  }

  if (lowIssues.length > 0) {
    alerts.push({
      skuId,
      type: 'MINOR_ISSUES',
      severity: 'LOW',
      message: `[${product.productTitle || skuId}] Has ${lowIssues.length} low-severity issue(s): ${lowIssues.map(i => i.issueType).join(', ')}`,
    });
  }

  for (const alert of alerts) {
    const existing = await prisma.alert.findFirst({
      where: { skuId: alert.skuId, type: alert.type, message: alert.message },
    });
    if (!existing) {
      await prisma.alert.create({ data: alert });
    }
  }
}

export async function generatePriceAlerts(): Promise<void> {
  const products = await prisma.product.findMany({
    where: { price: { not: null } },
    include: { competitorPrices: true },
  });

  for (const product of products) {
    if (!product.price || product.competitorPrices.length === 0) continue;

    const lowestCompetitor = Math.min(...product.competitorPrices.map(p => p.competitorPrice));
    const percentAbove = ((product.price - lowestCompetitor) / lowestCompetitor) * 100;

    if (percentAbove > 10) {
      const existing = await prisma.alert.findFirst({
        where: {
          skuId: product.skuId,
          type: 'PRICE_TOO_HIGH',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            skuId: product.skuId,
            type: 'PRICE_TOO_HIGH',
            severity: 'HIGH',
            message: `[${product.productTitle || product.skuId}] Price (₹${product.price}) is ${Math.round(percentAbove)}% higher than lowest competitor (₹${lowestCompetitor})`,
          },
        });
      }
    }
  }
}
