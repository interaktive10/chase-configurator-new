/// <reference types="vite/client" />

declare module '*.css?inline' {
    const css: string;
    export default css;
}

declare namespace JSX {
    interface IntrinsicElements {
        'model-viewer': any;
    }
}
