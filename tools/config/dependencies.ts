export interface AssetDependency {
    type: string;
    path?: string;
    glob?: string;
}

export function getAssetDependencies() : AssetDependency[] {
    return [
        { type: 'css', path: './node_modules/highlight.js/styles/solarized-dark.css'},
        { type: 'css', path: './node_modules/font-awesome/css/font-awesome.css' },
        { type: 'css', path: './node_modules/skeleton-css/css/normalize.css' },
        { type: 'css', path: './node_modules/skeleton-css/css/skeleton.css' },
        { type: 'font', glob: './node_modules/font-awesome/fonts/*.{otf,eot,svg,ttf,woff,woff2}' }
    ];
}