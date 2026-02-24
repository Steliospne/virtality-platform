import {
  organizationClient,
  adminClient,
  phoneNumberClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { stripeClient } from '@better-auth/stripe/client';

const isMobile = process.env.NEXT_PUBLIC_MOBILE_DEV === 'true';
const authURL = process.env.NEXT_PUBLIC_AUTH_URL?.replace(/\/$/, '') ?? '';

const baseURL = isMobile
  ? 'https://service.virtality.app/api/v1/auth'
  : `${authURL}/api/v1/auth`;

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    adminClient(),
    organizationClient(),
    phoneNumberClient(),
    stripeClient({
      subscription: true,
    }),
  ],
});

export type User = typeof authClient.$Infer.Session.user;

export type Session = typeof authClient.$Infer.Session.session;
