import { NextRequest, NextResponse } from 'next/server';
import { uploadBufferToR2, getPresignedUploadUrl } from '@/src/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Mode 1: Request pre-signed URL (recommended for direct large file uploads)
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { filename, contentType: fileType } = body;

      if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
      }

      const key = `batteries/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const presigned = await getPresignedUploadUrl(key, fileType || 'image/jpeg');

      if (!presigned) {
        return NextResponse.json({ error: 'R2 storage credentials not configured' }, { status: 503 });
      }

      return NextResponse.json(presigned);
    }

    // Mode 2: Direct multipart file upload via server
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const key = `batteries/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const url = await uploadBufferToR2(key, buffer, file.type || 'application/octet-stream');

      if (!url) {
        return NextResponse.json({ error: 'Failed to upload to Cloudflare R2' }, { status: 500 });
      }

      return NextResponse.json({ success: true, url, key });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (error: any) {
    console.error('R2 upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
