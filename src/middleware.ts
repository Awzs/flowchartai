import { betterFetch } from '@better-fetch/fetch';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { LOCALES, LOCALE_COOKIE_NAME, routing } from './i18n/routing';
import type { Session } from './lib/auth-types';
import {
  DEFAULT_LOGIN_REDIRECT,
  protectedRoutes,
  routesNotAllowedByLoggedInUsers,
} from './routes';

const intlMiddleware = createMiddleware(routing);

/**
 * 1. Next.js middleware
 * https://nextjs.org/docs/app/building-your-application/routing/middleware
 *
 * 2. Better Auth middleware
 * https://www.better-auth.com/docs/integrations/next#middleware
 *
 * In Next.js middleware, it's recommended to only check for the existence of a session cookie
 * to handle redirection. To avoid blocking requests by making API or database calls.
 */
export default async function middleware(req: NextRequest) {
  const { nextUrl, headers } = req;
  console.log('>> middleware start, pathname', nextUrl.pathname);

  // Locale detection
  const localeFromPath = nextUrl.pathname.split('/')[1];
  const hasLocalePrefix = LOCALES.includes(localeFromPath);
  const localeCookie = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const isValidLocale = (value: string | undefined) =>
    Boolean(value && LOCALES.includes(value));

  let preferredLocale = isValidLocale(localeCookie) ? localeCookie : undefined;

  if (!preferredLocale) {
    const country = req.geo?.country?.toUpperCase();
    if (country === 'CN') {
      preferredLocale = 'zh';
    } else {
      preferredLocale = routing.defaultLocale;
    }
  }

  if (!preferredLocale) {
    preferredLocale = routing.defaultLocale;
  }

  if (!hasLocalePrefix) {
    const basePath = nextUrl.pathname === '/' ? '' : nextUrl.pathname;
    const redirectUrl = new URL(
      `/${preferredLocale}${basePath}`,
      nextUrl.origin
    );
    redirectUrl.search = nextUrl.search;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE_NAME, preferredLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    console.log('<< middleware end, locale redirect', preferredLocale);
    return response;
  }

  const currentLocale = localeFromPath;

  // do not use getSession() here, it will cause error related to edge runtime
  // const session = await getSession();
  const { data: session } = await betterFetch<Session>(
    '/api/auth/get-session',
    {
      baseURL: req.nextUrl.origin,
      headers: {
        cookie: req.headers.get('cookie') || '', // Forward the cookies from the request
      },
    }
  );
  const isLoggedIn = !!session;
  // console.log('middleware, isLoggedIn', isLoggedIn);

  // Get the pathname of the request (e.g. /zh/dashboard to /dashboard)
  const pathnameWithoutLocale = getPathnameWithoutLocale(
    nextUrl.pathname,
    LOCALES
  );

  // If the route can not be accessed by logged in users, redirect if the user is logged in
  if (isLoggedIn) {
    const isNotAllowedRoute = routesNotAllowedByLoggedInUsers.some((route) =>
      new RegExp(`^${route}$`).test(pathnameWithoutLocale)
    );
    if (isNotAllowedRoute) {
      console.log(
        '<< middleware end, not allowed route, already logged in, redirecting to dashboard'
      );
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    new RegExp(`^${route}$`).test(pathnameWithoutLocale)
  );
  // console.log('middleware, isProtectedRoute', isProtectedRoute);

  // If the route is a protected route, redirect to login if user is not logged in
  if (!isLoggedIn && isProtectedRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    console.log(
      '<< middleware end, not logged in, redirecting to login, callbackUrl',
      callbackUrl
    );
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Apply intlMiddleware for all routes
  console.log('<< middleware end, applying intlMiddleware');
  const response = intlMiddleware(req);

  if (
    currentLocale &&
    (!localeCookie || localeCookie !== currentLocale) &&
    isValidLocale(currentLocale)
  ) {
    response.cookies.set(LOCALE_COOKIE_NAME, currentLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

/**
 * Get the pathname of the request (e.g. /zh/dashboard to /dashboard)
 */
function getPathnameWithoutLocale(pathname: string, locales: string[]): string {
  const localePattern = new RegExp(`^/(${locales.join('|')})/`);
  return pathname.replace(localePattern, '/');
}

/**
 * Next.js internationalized routing
 * specify the routes the middleware applies to
 *
 * https://next-intl.dev/docs/routing#base-path
 */
export const config = {
  // The `matcher` is relative to the `basePath`
  matcher: [
    // Match all pathnames except for
    // - if they start with `/api`, `/_next` or `/_vercel`
    // - if they contain a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
