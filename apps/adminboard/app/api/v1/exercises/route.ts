import { getUserAndSession } from '@/lib/actions/authActions'
import { getExercises } from '@/data/server/exercise'
import { NextResponse } from 'next/server'

export async function GET() {
  const data = await getUserAndSession()

  if (!data)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const exercises = await getExercises()

  return NextResponse.json({ exercises })
}
export async function POST() {}
