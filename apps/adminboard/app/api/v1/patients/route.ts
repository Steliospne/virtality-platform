import { getUserAndSession } from '@/lib/actions/authActions';
import { getPatients } from '@/data/server/patient';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await getUserAndSession();

  if (!data)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patients = await getPatients();

  return Response.json({ patients });
}
export async function POST() {}
