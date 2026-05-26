import prisma from '../lib/prisma';
import { Severity } from '@prisma/client';

interface ProductData {
  skuId: string;
  productTitle?: string | null;
  description?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  mrp?: number | null;
  imageUrl?: string | null;
  availability?: string | null;
  color?: string | null;
  size?: string | null;
  material?: string | null;
}

interface Issue {
  issueType: string;
  severity: Severity;
  message: string;
  suggestedFix: string;
}

export async function validateProduct(product: ProductData): Promise<{ issues: Issue[]; qualityScore: number }> {
  const issues: Issue[] = [];

  if (!product.productTitle || product.productTitle.trim() === '') {
    issues.push({
      issueType: 'MISSING_TITLE',
      severity: 'HIGH',
      message: 'Product title is missing',
      suggestedFix: 'Add a clear product title with brand, type, and key attributes.',
    });
  } else if (product.productTitle.trim().split(/\s+/).length < 4) {
    issues.push({
      issueType: 'SHORT_TITLE',
      severity: 'MEDIUM',
      message: `Title "${product.productTitle}" is too short (less than 4 words)`,
      suggestedFix: 'Add brand, product type, color, gender, or material to the title.',
    });
  }

  if (!product.brand || product.brand.trim() === '') {
    issues.push({
      issueType: 'MISSING_BRAND',
      severity: 'MEDIUM',
      message: 'Brand is missing',
      suggestedFix: 'Add brand if known, or mark as unbranded.',
    });
  }

  if (product.price === null || product.price === undefined || isNaN(product.price)) {
    issues.push({
      issueType: 'INVALID_PRICE',
      severity: 'HIGH',
      message: 'Price is missing or not a valid number',
      suggestedFix: 'Price should be a positive numeric value.',
    });
  } else if (product.price <= 0) {
    issues.push({
      issueType: 'INVALID_PRICE',
      severity: 'HIGH',
      message: `Price ${product.price} is not valid (must be positive)`,
      suggestedFix: 'Price should be a positive numeric value.',
    });
  }

  if (product.mrp && product.price && product.mrp < product.price) {
    issues.push({
      issueType: 'MRP_LOWER_THAN_PRICE',
      severity: 'HIGH',
      message: `MRP (${product.mrp}) is lower than selling price (${product.price})`,
      suggestedFix: 'Correct MRP or selling price. MRP should be >= selling price.',
    });
  }

  if (!product.imageUrl || product.imageUrl.trim() === '') {
    issues.push({
      issueType: 'MISSING_IMAGE',
      severity: 'HIGH',
      message: 'Product image URL is missing',
      suggestedFix: 'Add at least one product image URL.',
    });
  } else {
    try {
      new URL(product.imageUrl);
    } catch {
      issues.push({
        issueType: 'BROKEN_IMAGE_URL',
        severity: 'MEDIUM',
        message: `Image URL "${product.imageUrl}" is not a valid URL`,
        suggestedFix: 'Replace with an accessible image URL.',
      });
    }
  }

  // Duplicate SKU detection is handled at the CSV processor level during batch imports

  if (!product.description || product.description.trim().length < 20) {
    issues.push({
      issueType: 'WEAK_DESCRIPTION',
      severity: 'LOW',
      message: 'Product description is weak or too short',
      suggestedFix: 'Add more product details, features, and attributes.',
    });
  }

  const missingAttrs: string[] = [];
  if (!product.color) missingAttrs.push('color');
  if (!product.size) missingAttrs.push('size');
  if (!product.material) missingAttrs.push('material');
  if (missingAttrs.length >= 2) {
    issues.push({
      issueType: 'MISSING_ATTRIBUTES',
      severity: 'MEDIUM',
      message: `Missing important attributes: ${missingAttrs.join(', ')}`,
      suggestedFix: `Add ${missingAttrs.join(', ')} for better discoverability.`,
    });
  }

  if (product.availability === 'out_of_stock') {
    issues.push({
      issueType: 'OUT_OF_STOCK',
      severity: 'LOW',
      message: 'Product is out of stock',
      suggestedFix: 'Mark separately or notify operations team to restock.',
    });
  }

  let qualityScore = 100;
  for (const issue of issues) {
    if (issue.severity === 'HIGH') qualityScore -= 20;
    else if (issue.severity === 'MEDIUM') qualityScore -= 10;
    else qualityScore -= 5;
  }
  qualityScore = Math.max(0, qualityScore);

  return { issues, qualityScore };
}

export async function validateAndStoreIssues(skuId: string, product: ProductData): Promise<number> {
  const { issues, qualityScore } = await validateProduct(product);

  if (issues.length > 0) {
    await prisma.productIssue.deleteMany({ where: { skuId } });
    await prisma.productIssue.createMany({
      data: issues.map(issue => ({ ...issue, skuId })),
    });
  }

  await prisma.product.update({
    where: { skuId },
    data: { qualityScore },
  });

  return qualityScore;
}
