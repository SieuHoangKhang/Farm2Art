import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function signParams(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

function getCloudinaryEnvStatus() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME ?? '';
  const apiKey = process.env.CLOUDINARY_API_KEY ?? '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';

  const missing: string[] = [];
  if (!cloudName) missing.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
  if (!apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');

  return { cloudName, apiKey, apiSecret, missing };
}

export async function POST(request: NextRequest) {
  try {
    const { cloudName, apiKey, apiSecret, missing } = getCloudinaryEnvStatus();
    if (missing.length) {
      return NextResponse.json({ error: 'Missing Cloudinary env config', missing }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Không có file hợp lệ được cung cấp' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File không phải định dạng ảnh' }, { status: 400 });
    }

    // Giới hạn 5MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'Ảnh quá lớn (tối đa 5MB)' }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'farm2art/avatars';
    const signature = signParams({ folder, timestamp }, apiSecret);

    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('api_key', apiKey);
    cloudinaryForm.append('timestamp', timestamp);
    cloudinaryForm.append('folder', folder);
    cloudinaryForm.append('signature', signature);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log('Uploading to Cloudinary:', cloudinaryUrl);
    console.log('Signature params:', { api_key: apiKey, timestamp, folder, signature: signature.substring(0, 10) + '...' });
    
    const response = await fetch(cloudinaryUrl, { method: 'POST', body: cloudinaryForm });

    const payload = await response.json().catch(() => null);
    console.log('Cloudinary response:', payload);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Lỗi upload lên Cloudinary', details: payload ?? { status: response.status } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      secure_url: payload?.secure_url,
      public_id: payload?.public_id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Lỗi xử lý request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
