import { NextResponse } from 'next/server';
import dbConnect, { hasMongoUri } from '@/lib/mongodb';
import DashboardImage from '@/models/DashboardImage';
import { uploadImage, deleteImage, cloudinaryConfigured } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// GET - Fetch all dashboard images
export async function GET() {
  try {
    if (!hasMongoUri) {
      return NextResponse.json({ error: 'MONGODB_URI is missing. Add it to .env.local and restart the dev server.' }, { status: 500 });
    }
    await dbConnect();
    const images = await DashboardImage.find().sort({ createdAt: -1 });
    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

// POST - Upload a new image
export async function POST(request) {
  try {
    if (!hasMongoUri) {
      return NextResponse.json({ error: 'MONGODB_URI is missing. Add it to .env.local and restart the dev server.' }, { status: 500 });
    }
    await dbConnect();
    
    if (!cloudinaryConfigured) {
      return NextResponse.json({
        error: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
      }, { status: 500 });
    }
    
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary (increased timeout handled in uploadImage)
    const uploadResult = await uploadImage(buffer, { folder: 'dashboard_images' });
    
    if (!uploadResult) {
      return NextResponse.json({ error: 'Failed to upload image (no response from Cloudinary).' }, { status: 500 });
    }

    // Save to database
    const newImage = await DashboardImage.create({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    });

    return NextResponse.json(newImage, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error?.message || 'Failed to upload image';
    const status = error?.http_code === 499 ? 504 : 500; // 499 from Cloudinary means timeout
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE - Remove an image
export async function DELETE(request) {
  try {
    if (!hasMongoUri) {
      return NextResponse.json({ error: 'MONGODB_URI is missing. Add it to .env.local and restart the dev server.' }, { status: 500 });
    }
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    const image = await DashboardImage.findById(id);
    
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete from Cloudinary
    await deleteImage(image.publicId);

    // Delete from database
    await DashboardImage.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
