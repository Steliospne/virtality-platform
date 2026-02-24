import { getUserAndSession } from '@/lib/actions/authActions';
import { getFiles } from '@/S3';
import { NextResponse } from 'next/server';

export const GET = async () => {
  const data = await getUserAndSession();

  if (!data)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const images = await getFiles();

  return NextResponse.json({ images });
};
