import { routing } from '@/i18n/routing';
import type { Locale } from 'next-intl';

function resolveBaseUrl(): string {
  const envBaseUrl = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].find((value) => value?.trim().length);

  if (envBaseUrl) {
    // 始终使用环境变量声明的主域，避免不同子域触发 OAuth 回调校验失败
    return envBaseUrl.trim().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL?.length) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Get the base URL of the application
 */
export function getBaseUrl(): string {
  return resolveBaseUrl();
}

/**
 * Check if the locale should be appended to the URL
 */
export function shouldAppendLocale(locale?: Locale | null): boolean {
  return !!locale && locale !== routing.defaultLocale && locale !== 'default';
}

/**
 * Get the URL of the application with the locale appended
 */
export function getUrlWithLocale(url: string, locale?: Locale | null): string {
  const origin = getBaseUrl();
  return shouldAppendLocale(locale)
    ? `${origin}/${locale}${url}`
    : `${origin}${url}`;
}

/**
 * Adds locale to the callbackURL parameter in authentication URLs
 *
 * Example:
 * Input: http://localhost:3000/api/auth/reset-password/token?callbackURL=/auth/reset-password
 * Output: http://localhost:3000/api/auth/reset-password/token?callbackURL=/zh/auth/reset-password
 *
 * http://localhost:3000/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9&callbackURL=/dashboard
 * Output: http://localhost:3000/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiJ9&callbackURL=/zh/dashboard
 *
 * @param url - The original URL with callbackURL parameter
 * @param locale - The locale to add to the callbackURL
 * @returns The URL with locale added to callbackURL if necessary
 */
export function getUrlWithLocaleInCallbackUrl(
  url: string,
  locale: Locale
): string {
  // If we shouldn't append locale, return original URL
  if (!shouldAppendLocale(locale)) {
    return url;
  }

  try {
    const origin = getBaseUrl();
    const shouldReturnRelative = url.startsWith('/') && !url.startsWith('//');

    // 支持相对路径，通过基准站点构造完整 URL，避免解析失败
    const urlObj = new URL(url, origin);

    // Check if there's a callbackURL parameter
    const callbackURL = urlObj.searchParams.get('callbackURL');

    if (callbackURL) {
      // 解析 callbackURL，兼容相对与绝对地址
      const callbackUrlObj = new URL(callbackURL, origin);
      const callbackPathname = callbackUrlObj.pathname;

      if (!callbackPathname.match(new RegExp(`^/${locale}(/|$)`))) {
        const normalizedPathname = callbackPathname.startsWith('/')
          ? callbackPathname
          : `/${callbackPathname}`;
        callbackUrlObj.pathname = `/${locale}${normalizedPathname}`;
      }

      const callbackIsAbsolute =
        callbackURL.startsWith('http://') || callbackURL.startsWith('https://');
      const formattedCallbackUrl = callbackIsAbsolute
        ? callbackUrlObj.toString()
        : `${callbackUrlObj.pathname}${callbackUrlObj.search}${callbackUrlObj.hash}`;

      urlObj.searchParams.set('callbackURL', formattedCallbackUrl);
    }

    if (shouldReturnRelative) {
      return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }

    // 对于绝对路径，直接返回完整地址，确保邮件中的链接可用
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn('Failed to parse URL for locale insertion:', url, error);
    return url;
  }
}
/**
 * Get the URL of the image, if the image is a relative path, it will be prefixed with the base URL
 * @param image - The image URL
 * @returns The URL of the image
 */
export function getImageUrl(image: string): string {
  const origin = getBaseUrl();
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  if (image.startsWith('/')) {
    return `${origin}${image}`;
  }
  return `${origin}/${image}`;
}

/**
 * Get the Stripe dashboard customer URL
 * @param customerId - The Stripe customer ID
 * @returns The Stripe dashboard customer URL
 */
export function getStripeDashboardCustomerUrl(customerId: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `https://dashboard.stripe.com/test/customers/${customerId}`;
  }
  return `https://dashboard.stripe.com/customers/${customerId}`;
}
