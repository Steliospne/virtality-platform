// App Router style (route.ts)
import s3 from '@/S3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
const AwsS3Bucket = process.env.AWS_S3_BUCKET;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (!key) return new NextResponse('Missing key', { status: 400 });

  try {
    const command = new GetObjectCommand({
      Bucket: AwsS3Bucket!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    const s3Res = await fetch(signedUrl);
    if (!s3Res.ok || !s3Res.body)
      return new NextResponse('Failed to fetch image', { status: 500 });

    const headers = new Headers();
    headers.set(
      'Content-Type',
      s3Res.headers.get('Content-Type') || 'image/jpeg',
    );
    headers.set('Cache-Control', 'public, max-age=43200'); // Cache for 12 hours

    return new NextResponse(s3Res.body, { status: 200, headers });
  } catch (e) {
    console.error('Proxy error', e);
    return new NextResponse('Error proxying image', { status: 500 });
  }
}
