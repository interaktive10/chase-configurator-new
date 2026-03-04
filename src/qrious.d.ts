import React from 'react';

declare module 'qrious' {
    export default class QRious {
        constructor(options: any);
    }
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                ar?: boolean | string;
                'ar-modes'?: string;
                'camera-controls'?: boolean | string;
                'touch-action'?: string;
                'auto-rotate'?: boolean | string;
                'shadow-intensity'?: string | number;
                'environment-image'?: string;
                exposure?: string | number;
                alt?: string;
                src?: string;
                class?: string;
            };
        }
    }
}
