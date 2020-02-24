/* eslint-disable compat/compat */

import * as autoprefixer from 'autoprefixer';
import * as CopyPlugin from 'copy-webpack-plugin';
import * as cssnano from 'cssnano';
import * as fs from 'fs';
import * as path from 'path';
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
        SONG_REQUEST_URL: string;
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

    const defines: { [prop: string]: string } = {};
    for (const [k, v] of Object.entries(settings.defines)) {
        defines[k] = JSON.stringify(v);
    }

    const context = path.resolve(__dirname, 'src');
    const players = fs
        .readdirSync(path.resolve(context, 'players'))
        .filter(file => fs.statSync(`./src/players/${file}`).isDirectory());

    const developmentEntries = production
        ? []
        : [
              `webpack-dev-server/client?http://0.0.0.0:${port}`,
              'webpack/hot/only-dev-server',
          ];

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
                    ...developmentEntries,
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
                    use: ['html-loader?minimize', 'transform-loader?0'],
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
                                modules: true,
                                localsConvention: 'camelCaseOnly',
                                importLoaders: 1,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [autoprefixer, cssnano],
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
            ...(production ? [] : [new webpack.HotModuleReplacementPlugin()]),
            ...(analyze ? [new BundleAnalyzerPlugin()] : []),
            new CopyPlugin([
                {
                    from: path.resolve(__dirname, 'src', 'public'),
                    to: path.resolve(__dirname, 'dist'),
                },
            ]),
            new webpack.LoaderOptionsPlugin({
                options: {
                    transforms: [
                        () => {
                            let data = '';
                            return through2(
                                function(buffer, _, callback) {
                                    data += buffer;
                                    callback(null, '');
                                },
                                function(callback) {
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
            contentBase: path.resolve(__dirname, 'dist'),
            compress: true,
            host: '0.0.0.0',
            port,
            publicPath: '/',
            watchOptions: {
                poll: 1000,
            },
        },
    };
};
