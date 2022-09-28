const path = require('path');

const config = {
    mode: 'production',
    // mode: 'development',
    entry: './index.js',
    module: {
        rules: [
            {
                test: /\.svelte$/,
                use: [
                    'svelte-loader'
                ],
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ],
            },
        ]
    },
    optimization: {
        concatenateModules:true,
        usedExports: true,
        minimize: false,
    },

};

module.exports = config;