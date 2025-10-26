import type { NextConfig } from "next";

// 서버 전용 모듈들을 클라이언트에서 완전히 차단
const serverOnlyModules = [
  'pg',
  'argon2', 
  'pg-connection-string',
  'pg-pool',
  'dns',
  'net',
  'tls',
  'fs',
  'child_process'
];

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드에서 Node.js 모듈들을 빈 객체로 대체
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        dns: false,
        child_process: false,
        worker_threads: false,
        perf_hooks: false,
        v8: false,
        vm: false,
        async_hooks: false,
        pg: false,
        'pg-connection-string': false,
        'pg-pool': false,
        argon2: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'argon2', 'pg-connection-string', 'pg-pool'],
  },
};

export default nextConfig;