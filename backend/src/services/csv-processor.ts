import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../lib/prisma';
import { validateAndStoreIssues } from './validator';
import { enhanceProductTitle } from './title-enhancer';
import { generateAlertsForProduct } from './alert-engine';

interface CsvRow {
  sku_id?: string;
  skuId?: string;
  product_title?: string;
  productTitle?: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: string;
  mrp?: string;
  image_url?: string;
  imageUrl?: string;
  product_url?: string;
  productUrl?: string;
  availability?: string;
  color?: string;
  size?: string;
  material?: string;
}

export async function processCsv(jobId: string, filePath: string, enhanceTitle: boolean): Promise<void> {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING', progress: 10, startedAt: new Date() },
    });

    const rows = await parseCsvFile(filePath);

    if (rows.length === 0) {
      throw new Error('CSV file is empty or has no valid rows');
    }

    const totalRows = rows.length;
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const skuId = row.sku_id || row.skuId;

      if (!skuId) {
        failedCount++;
        continue;
      }

      try {
        const price = parseFloat(row.price || '0') || null;
        const mrp = parseFloat(row.mrp || '0') || null;

        const existing = await prisma.product.findUnique({ where: { skuId } });

        const productData = {
          productTitle: row.product_title || row.productTitle || null,
          description: row.description || null,
          brand: row.brand || null,
          category: row.category || null,
          price,
          mrp,
          imageUrl: row.image_url || row.imageUrl || null,
          productUrl: row.product_url || row.productUrl || null,
          availability: row.availability || 'in_stock',
          color: row.color || null,
          size: row.size || null,
          material: row.material || null,
          jobId,
        };

        if (existing) {
          await prisma.product.update({
            where: { skuId },
            data: productData,
          });
        } else {
          await prisma.product.create({
            data: { skuId, ...productData },
          });
        }

        await validateAndStoreIssues(skuId, { skuId, ...productData });

        if (enhanceTitle) {
          const product = await prisma.product.findUnique({ where: { skuId } });
          if (product) {
            const enhanced = enhanceProductTitle(product);
            await prisma.product.update({
              where: { skuId },
              data: { enhancedTitle: enhanced.enhancedTitle },
            });
          }
        }

        await generateAlertsForProduct(skuId);
        processedCount++;
      } catch (err) {
        console.error(`Error processing row ${i + 1} (SKU: ${skuId}):`, err);
        failedCount++;
      }

      const progress = Math.round(10 + ((i + 1) / totalRows) * 85);
      await prisma.job.update({
        where: { id: jobId },
        data: { progress },
      });
    }

    const finalStatus = failedCount === 0 ? 'COMPLETED' :
      processedCount === 0 ? 'FAILED' : 'PARTIALLY_COMPLETED';

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        progress: 100,
        completedAt: new Date(),
        errorMessage: failedCount > 0 ? `${failedCount} row(s) failed to process` : null,
      },
    });
  } catch (error: any) {
    console.error('CSV processing error:', error);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        progress: 0,
        errorMessage: error.message || 'CSV processing failed',
        completedAt: new Date(),
      },
    });
  } finally {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
}

function parseCsvFile(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: CsvRow) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}
