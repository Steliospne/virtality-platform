import { getPresetWithExercises } from '@/data/server/preset'
import { getUserAndSession } from '@/lib/actions/authActions'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const data = await getUserAndSession()
  const { id } = await params

  if (!data)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (id) {
    const preset = await getPresetWithExercises(id)
    return NextResponse.json({ preset })
  }

  return NextResponse.json({ error: 'Not found.' }, { status: 404 })
}
export async function POST() {}
export async function PUT() {}
export async function DELETE() {}
