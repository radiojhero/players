/* eslint-disable compat/compat */

import * as fs from 'fs';
import * as path from 'path';

import * as CopyPlugin from 'copy-webpack-plugin';
import * as through2 from 'through2';
import * as webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

interface Settings {
    defines: {
        SOURCES: {
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

export default ({
    production = false,
    port = 8080,
    settingsFile = 'player-settings.json',
    analyze = false,
} = {}): webpack.Configuration => {
    const settings = JSON.parse(
        process.env.PLAYER_SETTINGS || fs.readFileSync(settingsFile, 'utf8'),
    ) as Settings;

    const defines: Record<string, string> = {};
    for (const [k, v] of Object.entries(settings.defines)) {
        defines[k] = JSON.stringify(v);
    }

    const context = path.resolve(__dirname, 'src');
    const players = fs
        .readdirSync(path.resolve(context, 'players'))
        .filter(file => fs.statSync(`./src/players/${file}`).isDirectory());

    return {
        mode: production ? 'production' : 'development',
        optimization: {
            splitChunks: false,
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
            path: path.resolve(__dirname, 'dist'),
            publicPath: '/',
        },
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: 'source-map-loader',
                },
                {
                    test: /\.html$/,
                    exclude: /node_modules/,
                    use: ['html-loader', 'transform-loader?0'],
                },
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.scss$/,
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
        },
        plugins: [
            ...(analyze ? [new BundleAnalyzerPlugin()] : []),
            new CopyPlugin({
                patterns: [
                    {
                        from: path.resolve(__dirname, 'src', 'public'),
                        to: path.resolve(__dirname, 'dist'),
                    },
                ],
            }),
            new webpack.LoaderOptionsPlugin({
                options: {
                    transforms: [
                        () => {
                            let data = '';
                            return through2(
                                function (buffer, _, callback) {
                                    data += buffer;
                                    // eslint-disable-next-line unicorn/no-null
                                    callback(null, '');
                                },
                                function (callback) {
                                    for (const [k, v] of Object.entries(
                                        settings.defines,
                                    )) {
                                        data = data.replace(
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
        devServer: {
            hot: true,
            host: 'local-ip',
            port,
            static: {
                directory: path.resolve(__dirname, 'dist'),
                watch: true,
            },
            devMiddleware: {
                publicPath: '/',
            },
        },
    };
};
