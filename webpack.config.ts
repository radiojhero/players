/* eslint-disable compat/compat */

import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import through2 from 'through2';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { type Configuration } from 'webpack-dev-server';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

interface Settings {
    defines: {
        SOURCES: {
            title: string;
            type: string;
            bitrate: number;
            burst: number;
            src: string;
        }[];
        METADATA_URL: string;
        METADATA_INTERVAL: number;
        PLAYER_DOMAIN: string;
        PLAYER_NAMESPACE: string;
        PLAYER_INITIAL_VOLUME: number;
        MAIN_WEBSITE_HOME: string;
        MAIN_WEBSITE_TIMETABLE: string;
        MAIN_WEBSITE_REQUESTS: string;
        MAIN_WEBSITE_CHAT: string;
        MAIN_WEBSITE_LISTEN: string;
        LISTEN_URL: string;
        LISTEN_MANUAL_URL: string;
    };
    banner: string;
}

const wdsConfiguration: Configuration = {
    hot: true,
    static: {
        directory: path.resolve(currentDirectory, 'dist'),
        watch: true,
    },
    devMiddleware: {
        publicPath: '/',
    },
};

const config = ({
    production = false,
    port = 8080,
    settingsFile = 'player-settings.json',
    analyze = false,
} = {}): webpack.Configuration => {
    const settings = JSON.parse(
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        process.env.PLAYER_SETTINGS || fs.readFileSync(settingsFile, 'utf8'),
    ) as Settings;

    const defines: Record<string, string> = {};
    for (const [k, v] of Object.entries(settings.defines)) {
        defines[k] = JSON.stringify(v);
    }

    const context = path.resolve(currentDirectory, 'src');
    const players = fs
        .readdirSync(path.resolve(context, 'players'))
        .filter(file => fs.statSync(`./src/players/${file}`).isDirectory());

    return {
        mode: production ? 'production' : 'development',
        optimization: {
            splitChunks: false,
            minimizer: [
                new TerserPlugin({
                    extractComments: false,
                }),
            ],
        },
        context,
        entry: (() => {
            const entries: webpack.Entry = { player: './core/index.ts' };

            for (const player of players) {
                entries[`players/${player}`] = [
                    './other/polyfills.ts',
                    `./players/${player}/index.ts`,
                ];
            }

            return entries;
        })(),
        output: {
            filename: '[name].js',
            path: path.resolve(currentDirectory, 'dist'),
            publicPath: '/',
        },
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/i,
                    exclude: /node_modules/,
                    use: 'source-map-loader',
                },
                {
                    test: /\.html$/i,
                    exclude: /node_modules/,
                    use: ['html-loader', 'transform-loader?0'],
                },
                {
                    test: /\.ts$/i,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.s[ac]ss$/i,
                    exclude: /node_modules/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    exportLocalsConvention: 'camelCaseOnly',
                                },
                                importLoaders: 1,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [['autoprefixer'], ['cssnano']],
                                },
                            },
                        },
                        'sass-loader',
                    ],
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
            fallback: { querystring: import.meta.resolve('querystring-es3') },
        },
        plugins: [
            ...(analyze ? [new BundleAnalyzerPlugin()] : []),
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(currentDirectory, 'src', 'public'),
                        to: path.resolve(currentDirectory, 'dist'),
                    },
                ],
            }),
            new webpack.LoaderOptionsPlugin({
                options: {
                    transforms: [
                        () => {
                            let data = '';
                            return through2(
                                function (buffer: string, _, callback) {
                                    data += buffer;

                                    callback(null, '');
                                },
                                function (callback) {
                                    for (const [k, v] of Object.entries(
                                        settings.defines,
                                    )) {
                                        data = data.replaceAll(
                                            new RegExp(`\\b${k}\\b`, 'g'),
                                            v.toString(),
                                        );
                                    }

                                    this.push(data);
                                    callback();
                                },
                            );
                        },
                    ],
                },
            }),
            new webpack.DefinePlugin(defines),
            new webpack.BannerPlugin({
                banner: settings.banner,
                entryOnly: true,
            }),
        ],
        devtool: 'source-map',
        devServer: { ...wdsConfiguration, port },
    };
};

export default config;
