/// <reference types="vite/client" />

declare module 'vite-jsconfig-paths' {
    import { Plugin } from 'vite';
    export default function jsconfigPaths(): Plugin;
}
