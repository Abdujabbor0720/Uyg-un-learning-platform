import { NextRequest, NextResponse } from 'next/server';
import { VideoService, initializeDatabase } from '@/lib/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    await initializeDatabase();
    const video = await VideoService.findByFilename(params.filename);
    
    if (!video) {
      return NextResponse.json({ error: 'Video topilmadi' }, { status: 404 });
    }

    return NextResponse.json(video, { status: 200 });
  } catch (error: any) {
    console.error('Video by filename error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
