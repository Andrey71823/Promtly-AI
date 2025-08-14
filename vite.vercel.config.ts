import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [
    nodePolyfills({
      include: ['path', 'buffer'],
    }),
    UnoCSS(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
    chrome129IssuePlugin(),
    optimizeCssModules({ apply: 'build' }),
  ],
});

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server: any) {
      server.middlewares.use('/', (req: any, res: any, next: any) => {
        const userAgent = req.headers['user-agent'] || '';
        if (userAgent.includes('Chrome/129')) {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        }
        next();
      });
    },
  };
}