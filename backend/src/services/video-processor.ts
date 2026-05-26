import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import OpenAI from 'openai';
import prisma from '../lib/prisma';
import { validateAndStoreIssues } from './validator';
import { enhanceProductTitle } from './title-enhancer';
import { generateAlertsForProduct } from './alert-engine';
import { v4 as uuidv4 } from 'uuid';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

interface ExtractedProduct {
  product_name?: string;
  brand?: string;
  category?: string;
  color?: string;
  material?: string;
  description?: string;
  estimated_price?: number;
}

async function extractFrames(videoPath: string, outputDir: string, numFrames: number = 3): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .on('end', () => {
        const frames = fs.readdirSync(outputDir)
          .filter(f => f.endsWith('.png'))
          .map(f => path.join(outputDir, f));
        resolve(frames);
      })
      .on('error', reject)
      .screenshots({
        count: numFrames,
        folder: outputDir,
        filename: 'frame-%i.png',
      });
  });
}

async function analyzeFrame(framePath: string): Promise<ExtractedProduct> {
  try {
    const imageData = fs.readFileSync(framePath);
    const base64Image = imageData.toString('base64');

    const response = await openrouter.chat.completions.create({
      model: 'google/gemini-2.0-flash-lite-001',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this product image carefully. Extract the following product information and return ONLY valid JSON (no markdown, no code blocks):
{
  "product_name": "full product name",
  "brand": "brand name or null",
  "category": "product category (e.g., Shoes, Clothing, Electronics)",
  "color": "primary color or null",
  "material": "material if visible or null",
  "description": "brief product description based on what you see",
  "estimated_price": null
}

If you cannot determine a field, set it to null.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const responseText = response.choices[0]?.message?.content || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.error('Vision API error:', error);
    return {};
  }
}

export async function processVideo(jobId: string, videoPath: string, enhanceTitle: boolean): Promise<void> {
  const framesDir = path.join(path.dirname(videoPath), `frames-${jobId}`);

  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING', progress: 10, startedAt: new Date() },
    });

    const frames = await extractFrames(videoPath, framesDir, 3);

    await prisma.job.update({
      where: { id: jobId },
      data: { progress: 40 },
    });

    if (frames.length === 0) {
      throw new Error('Could not extract any frames from video');
    }

    const middleFrame = frames[Math.floor(frames.length / 2)];
    const extracted = await analyzeFrame(middleFrame);

    await prisma.job.update({
      where: { id: jobId },
      data: { progress: 70 },
    });

    const skuId = `VID-${uuidv4().slice(0, 8).toUpperCase()}`;

    const product = await prisma.product.create({
      data: {
        skuId,
        jobId,
        productTitle: extracted.product_name || 'Unknown Product',
        brand: extracted.brand || null,
        category: extracted.category || null,
        color: extracted.color || null,
        material: extracted.material || null,
        description: extracted.description || null,
        price: extracted.estimated_price || null,
        availability: 'in_stock',
      },
    });

    await validateAndStoreIssues(skuId, product);

    if (enhanceTitle) {
      const enhanced = enhanceProductTitle(product);
      await prisma.product.update({
        where: { skuId },
        data: { enhancedTitle: enhanced.enhancedTitle },
      });
    }

    await generateAlertsForProduct(skuId);

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
    });
  } catch (error: any) {
    console.error('Video processing error:', error);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        progress: 0,
        errorMessage: error.message || 'Video processing failed',
        completedAt: new Date(),
      },
    });
  } finally {
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(framesDir)) {
        fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
        fs.rmdirSync(framesDir);
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
}
