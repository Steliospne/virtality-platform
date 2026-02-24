'use server';
import { headers } from 'next/headers';
import { User, Session } from '@virtality/db';

const baseURL = process.env.BETTER_AUTH_URL;

export const getUserAndSession = async () => {
  try {
    const headerStore = await headers();
    const cookie = headerStore.get('cookie');

    const res = await fetch(`${baseURL}/api/v1/me.getMe`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { cookie: cookie ?? '' },
    });

    if (!res.ok) return null;
    const data = (await res.json()) as unknown as {
      session: Session;
      user: User;
    };

    return data;
  } catch (error) {
    console.log(error);
    throw Error('[Better Auth] Problem with getting User and Session!');
  }
};
