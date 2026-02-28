import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ alt = 'Apoy logo', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/apoy-logo.png" alt={alt} {...props} />;
}
