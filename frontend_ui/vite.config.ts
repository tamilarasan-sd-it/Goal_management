import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { AtRule } from 'postcss';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = env.VITE_APP_BASE_NAME || '/';

  // const jsconfigPaths = (await import('vite-jsconfig-paths')).default;
  return {
    server: {
      host: '0.0.0.0',
      port: 5173
    },
    define: {
      global: 'window'
    },
    resolve: {
      alias: [
        { find: 'lazyImports', replacement: path.resolve(__dirname, 'src/lazyImports.jsx') }
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          charset: false
        },
        less: {
          charset: false
        }
      },
      charset: false,
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule: AtRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove();
                }
              }
            }
          }
        ]
      }
    },
    base: API_URL,
    plugins: [react()]
  };
});