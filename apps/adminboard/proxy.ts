import { NextRequest, NextResponse } from 'next/server';
import { getUserAndSession } from './lib/actions/authActions';

const { enabled } = process.env;

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname === '/userCreation' && (enabled === 'false' || true)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const data = await getUserAndSession();

  if (!data) {
    return NextResponse.redirect(new URL('/log-in', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!^$|api|_next/static|_next/image|favicon.ico|sign-up|userCreation|log-in).*)',
  ],
};
