import { NextRequest, NextResponse } from 'next/server';

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file được cung cấp' },
        { status: 400 }
      );
    }

    // Tạo FormData mới để gửi đến Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', 'farm2art_avatar'); // Cần tạo unsigned preset trên Cloudinary
    cloudinaryFormData.append('folder', 'farm2art/avatars');

    // Gửi đến Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error:', errorData);
      return NextResponse.json(
        { error: 'Lỗi upload lên Cloudinary', details: errorData },
        { status: 400 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      secure_url: data.secure_url,
      public_id: data.public_id,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Lỗi xử lý request' },
      { status: 500 }
    );
  }
}
