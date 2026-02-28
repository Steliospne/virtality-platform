import { getUserAndSession } from '@/lib/actions/authActions'
import { getPresets, getPresetsByUser } from '@/data/server/preset'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const data = await getUserAndSession()
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!data)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (userId) {
    const presets = await getPresetsByUser(userId)
    return NextResponse.json({ presets })
  }

  const presets = await getPresets()

  return NextResponse.json({ presets })
}
export async function POST() {}
