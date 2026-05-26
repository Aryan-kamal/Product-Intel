import fs from 'fs';
import csv from 'csv-parser';

const PLATFORMS = ['Amazon', 'Myntra', 'Ajio', 'Nykaa Fashion', 'Meesho', 'Tata Cliq'];

interface CompetitorPriceEntry {
  skuId: string;
  productName: string;
  platform: string;
  competitorUrl: string | null;
  competitorPrice: number;
  currency: string;
  lastCheckedAt: Date;
}

interface PriceComparison {
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  priceGap: number | null;
  percentDiff: number | null;
  recommendation: string;
  competitorCount: number;
}

export function generateMockPrices(skuId: string, productName: string, ourPrice: number): CompetitorPriceEntry[] {
  const numCompetitors = 3 + Math.floor(Math.random() * 3);
  const selectedPlatforms = PLATFORMS.sort(() => Math.random() - 0.5).slice(0, numCompetitors);

  return selectedPlatforms.map(platform => {
    const variance = (Math.random() * 0.4) - 0.2; // -20% to +20%
    const competitorPrice = Math.round(ourPrice * (1 + variance));

    return {
      skuId,
      productName,
      platform,
      competitorUrl: `https://www.${platform.toLowerCase().replace(/\s/g, '')}.com/product/${skuId}`,
      competitorPrice: Math.max(competitorPrice, 99),
      currency: 'INR',
      lastCheckedAt: new Date(),
    };
  });
}

export function getComparisonForProduct(ourPrice: number | null, competitorPrices: { competitorPrice: number }[]): PriceComparison {
  if (!ourPrice || competitorPrices.length === 0) {
    return {
      lowestPrice: null,
      highestPrice: null,
      averagePrice: null,
      priceGap: null,
      percentDiff: null,
      recommendation: competitorPrices.length === 0 ? 'No competitor data available' : 'Our price is not set',
      competitorCount: competitorPrices.length,
    };
  }

  const prices = competitorPrices.map(p => p.competitorPrice);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const priceGap = ourPrice - lowestPrice;
  const percentDiff = Math.round(((ourPrice - lowestPrice) / lowestPrice) * 100);

  let recommendation: string;
  if (ourPrice > lowestPrice * 1.10) {
    recommendation = `Lower price - overpriced by ${percentDiff}% compared to lowest competitor`;
  } else if (ourPrice < lowestPrice * 0.95) {
    recommendation = 'Price is very competitive - consider if margin is healthy';
  } else {
    recommendation = 'Price is competitive';
  }

  return {
    lowestPrice,
    highestPrice,
    averagePrice,
    priceGap,
    percentDiff,
    recommendation,
    competitorCount: prices.length,
  };
}

export function parseCompetitorCsv(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        const price = parseFloat(row.competitor_price || row.competitorPrice || '0');
        if (row.sku_id && price > 0) {
          results.push({
            skuId: row.sku_id,
            productName: row.product_name || row.productName || '',
            platform: row.platform || 'Unknown',
            competitorUrl: row.competitor_url || row.competitorUrl || null,
            competitorPrice: price,
            currency: row.currency || 'INR',
            lastCheckedAt: row.last_checked_at || row.lastCheckedAt || new Date().toISOString(),
          });
        }
      })
      .on('end', () => {
        fs.unlinkSync(filePath);
        resolve(results);
      })
      .on('error', reject);
  });
}
