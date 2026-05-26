interface ProductInput {
  productTitle?: string | null;
  brand?: string | null;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  description?: string | null;
}

interface EnhancedTitleResult {
  originalTitle: string;
  enhancedTitle: string;
  attributes: Record<string, string>;
  keywords: string[];
  reason: string;
}

const categoryKeywords: Record<string, string[]> = {
  shoes: ['running shoes', 'sports shoes', 'lightweight shoes', 'comfortable footwear'],
  dresses: ['casual dress', 'party wear', 'stylish dress', 'trendy fashion'],
  bags: ['travel bag', 'laptop bag', 'stylish bag', 'everyday carry'],
  electronics: ['latest tech', 'smart device', 'premium quality', 'high performance'],
  clothing: ['premium fabric', 'comfortable wear', 'trendy fashion', 'daily wear'],
  watches: ['analog watch', 'luxury watch', 'sports watch', 'premium timepiece'],
  accessories: ['fashion accessory', 'premium quality', 'trendy style', 'daily wear'],
  default: ['premium quality', 'best seller', 'top rated', 'value for money'],
};

function inferGender(product: ProductInput): string | null {
  const text = `${product.productTitle || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
  if (text.includes('men') || text.includes("men's") || text.includes('male')) return 'Men';
  if (text.includes('women') || text.includes("women's") || text.includes('female') || text.includes('ladies')) return 'Women';
  if (text.includes('kid') || text.includes('child') || text.includes('boy') || text.includes('girl')) return 'Kids';
  return null;
}

function inferProductType(product: ProductInput): string | null {
  const category = (product.category || '').toLowerCase();
  const title = (product.productTitle || '').toLowerCase();
  const combined = `${category} ${title}`;

  if (combined.includes('shoe') || combined.includes('sneaker') || combined.includes('boot')) return 'Shoes';
  if (combined.includes('dress')) return 'Dress';
  if (combined.includes('shirt') || combined.includes('t-shirt') || combined.includes('tshirt')) return 'Shirt';
  if (combined.includes('bag') || combined.includes('backpack')) return 'Bag';
  if (combined.includes('watch')) return 'Watch';
  if (combined.includes('jean') || combined.includes('pant') || combined.includes('trouser')) return 'Pants';
  return null;
}

export function enhanceProductTitle(product: ProductInput): EnhancedTitleResult {
  const originalTitle = product.productTitle || '';
  const attributes: Record<string, string> = {};

  if (product.brand) attributes['Brand'] = product.brand;
  if (product.color) attributes['Color'] = product.color;
  if (product.material) attributes['Material'] = product.material;
  if (product.size) attributes['Size'] = product.size;
  if (product.category) attributes['Category'] = product.category;

  const gender = inferGender(product);
  if (gender) attributes['Gender'] = gender;

  const productType = inferProductType(product);
  if (productType) attributes['Product Type'] = productType;

  const parts: string[] = [];
  if (product.brand) parts.push(product.brand);
  if (product.color) parts.push(product.color);
  if (product.material) parts.push(product.material);
  if (productType) parts.push(productType);
  else if (product.category) parts.push(product.category);
  if (gender) parts.push(`for ${gender}`);

  const materialSuffix = product.material ? ` with ${product.material} ${productType === 'Shoes' ? 'Upper' : 'Fabric'}` : '';

  let enhancedTitle = parts.join(' ');
  if (materialSuffix && !enhancedTitle.toLowerCase().includes(product.material!.toLowerCase())) {
    enhancedTitle += materialSuffix;
  }

  if (enhancedTitle.length < 10) {
    enhancedTitle = originalTitle;
  }

  const categoryKey = (product.category || 'default').toLowerCase();
  const keywords = categoryKeywords[categoryKey] || categoryKeywords['default'];

  const addedParts: string[] = [];
  if (product.brand && !originalTitle.toLowerCase().includes(product.brand.toLowerCase())) addedParts.push('brand');
  if (product.color && !originalTitle.toLowerCase().includes(product.color.toLowerCase())) addedParts.push('color');
  if (product.material && !originalTitle.toLowerCase().includes(product.material.toLowerCase())) addedParts.push('material');
  if (gender && !originalTitle.toLowerCase().includes(gender.toLowerCase())) addedParts.push('gender');

  const reason = addedParts.length > 0
    ? `Added ${addedParts.join(', ')} for better discoverability and SEO.`
    : 'Title already contains key attributes. Minor restructuring for clarity.';

  return {
    originalTitle,
    enhancedTitle,
    attributes,
    keywords,
    reason,
  };
}
