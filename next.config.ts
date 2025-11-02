import { createRequire } from 'node:module';
import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const require = createRequire(import.meta.url);

const rawNodeEnv = process.env.NODE_ENV;
const normalizedNodeEnv =
  typeof rawNodeEnv === 'string' ? rawNodeEnv.toLowerCase() : undefined;
const effectiveNodeEnv = normalizedNodeEnv ?? rawNodeEnv ?? 'development';

if (rawNodeEnv && normalizedNodeEnv && rawNodeEnv !== normalizedNodeEnv) {
  console.warn(
    `NODE_ENV 值应为小写，检测到 "${rawNodeEnv}"，建议改为 "${normalizedNodeEnv}".`
  );
}

/**
 * https://nextjs.org/docs/app/api-reference/config/next-config-js
 */
const nextConfig: NextConfig = {
  devIndicators: false,

  // Remove all console.* calls in production only
  compiler: {
    removeConsole: effectiveNodeEnv === 'production',
  },

  images: {
    // Cloudflare Workers requires unoptimized images
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'html.tailus.io',
      },
    ],
  },

  // Production optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },

  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      'mind-elixir-react/node_modules/react': require.resolve('react'),
      'mind-elixir-react/node_modules/react-dom': require.resolve('react-dom'),
      'mind-elixir-react/node_modules/react/jsx-runtime':
        require.resolve('react/jsx-runtime'),
      'mind-elixir-react/node_modules/react/jsx-dev-runtime': require.resolve(
        'react/jsx-dev-runtime'
      ),
      'mind-elixir-react/node_modules/react/jsx-runtime.js':
        require.resolve('react/jsx-runtime'),
      'mind-elixir-react/node_modules/react/jsx-dev-runtime.js':
        require.resolve('react/jsx-dev-runtime'),
    };
    return config;
  },

  async redirects() {
    return [
      {
        source: '/blog/flowchart-symbols',
        destination: '/blog/flowchart-symbols-guide',
        permanent: true,
      },
      {
        source: '/:locale/blog/flowchart-symbols',
        destination: '/:locale/blog/flowchart-symbols-guide',
        permanent: true,
      },
      {
        source: '/tools/ai-flowchart-generator',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:locale/tools/ai-flowchart-generator',
        destination: '/:locale',
        permanent: true,
      },
      {
        source: '/tools/flowchart-maker-ai',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:locale/tools/flowchart-maker-ai',
        destination: '/:locale',
        permanent: true,
      },
    ];
  },
};

/**
 * You can specify the path to the request config file or use the default one (@/i18n/request.ts)
 *
 * https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#next-config
 */
const withNextIntl = createNextIntlPlugin();

/**
 * withContentCollections must be the outermost plugin
 *
 * https://www.content-collections.dev/docs/quickstart/next
 */
export default withContentCollections(withNextIntl(nextConfig));

// Add OpenNext Cloudflare development support
if (effectiveNodeEnv === 'development') {
  import('@opennextjs/cloudflare')
    .then(({ initOpenNextCloudflareForDev }) => {
      initOpenNextCloudflareForDev();
    })
    .catch(() => {
      // Silently fail if package is not available
    });
}
