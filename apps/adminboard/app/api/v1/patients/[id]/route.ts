import { getUserAndSession } from '@/lib/actions/authActions';
import { getPatient } from '@/data/server/patient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const data = await getUserAndSession();

  if (!data)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patient = await getPatient(id);

  return NextResponse.json({ patient });
}
export async function POST() {}
export async function PUT() {}
// export async function DELETE(
//   req: Request,
//   { params }: { params: Promise<{ id: string; userId: string }> },
// ) {
//   const { id } = await params;
//   await deleteDeviceAction(id);
//   return Response.json({ status: 'ok' });
// }
