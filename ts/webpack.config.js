const
    path = require('path'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    CopyPlugin = require("copy-webpack-plugin"),
    { CleanWebpackPlugin } = require('clean-webpack-plugin'),
    TerserPlugin = require('terser-webpack-plugin'),
    OverwolfPlugin = require('./overwolf.webpack');

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--mode=production');

module.exports = env => ({
    mode: isProduction ? 'production' : 'development',
    entry: {
        background: './src/background/background.ts',
        desktop: './src/desktop/desktop.ts',
        desktopReact: './src/desktop/desktop-react.tsx',
        second_screen: './src/second-screen/second-screen.ts',
        second_screenReact: './src/second-screen/second-screen-react.tsx',
        in_game: './src/in_game/in_game.ts',
        in_gameReact: './src/in_game/in_game-react.tsx',
        quests_reminder: './src/in_game/quests_reminder.ts',
        quests_reminder: './src/quests_reminder/quests_reminder.ts',
        setting: './src/setting/Settings.ts',
        setting: './src/hotkeys/Hotkeys.ts',
        setting: './src/support/Support.ts'
    },
    devtool: isProduction ? false : 'inline-source-map',
    optimization: {
        minimize: isProduction,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: false, // Keep console statements for debugging
                        drop_debugger: isProduction,
                        pure_funcs: [] // Don't remove any console functions
                    },
                    mangle: isProduction,
                    format: {
                        comments: false
                    }
                },
                extractComments: false
            })
        ],
        splitChunks: {
            chunks: 'all',
            minSize: 50000,
            maxSize: 500000,
            cacheGroups: {
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                    name: 'react-vendor',
                    chunks: 'all',
                    priority: 20,
                    enforce: true
                },
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10,
                    reuseExistingChunk: true,
                    minChunks: 1
                },
                default: false,
                defaultVendors: false
            }
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        compilerOptions: {
                            ...(isProduction && {
                                removeComments: true,
                                sourceMap: false
                            })
                        }
                    }
                },
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    output: {
      path: path.resolve(__dirname, 'dist/'),
      filename: 'js/[name].js',
      chunkFilename: 'js/[name].[chunkhash].js'
    },
    plugins: [
        new CleanWebpackPlugin,
        new CopyPlugin({
            patterns: [ { from: "public", to: "./" } ],
        }),
        new HtmlWebpackPlugin({
            template: './src/background/background.html',
            filename: path.resolve(__dirname, './dist/background.html'),
            chunks: ['background']
        }),
        new HtmlWebpackPlugin({
            template: './src/desktop/desktop.html',
            filename: path.resolve(__dirname, './dist/desktop.html'),
            chunks: ['react-vendor', 'desktop', 'desktopReact']
        }),
        new HtmlWebpackPlugin({
            template: './src/second-screen/second-screen.html',
            filename: path.resolve(__dirname, './dist/second-screen.html'),
            chunks: ['react-vendor', 'second_screen', 'second_screenReact']
        }),
        new HtmlWebpackPlugin({
            template: './src/in_game/in_game.html',
            filename: path.resolve(__dirname, './dist/in_game.html'),
            chunks: ['react-vendor', 'in_game', 'in_gameReact']
        }),
        new HtmlWebpackPlugin({
            template: './src/setting/setting.html',
            filename: path.resolve(__dirname, './dist/setting.html'),
            chunks: ['setting']
        }),
        new HtmlWebpackPlugin({
            template: './src/hotkeys/hotkeys.html',
            filename: path.resolve(__dirname, './dist/hotkeys.html'),
            chunks: ['hotkeys']
        }),
        new HtmlWebpackPlugin({
            template: './src/support/support.html',
            filename: path.resolve(__dirname, './dist/support.html'),
            chunks: ['support']
        }),
        new HtmlWebpackPlugin({
            template: './src/warning/externalLinkWarning.html',
            filename: path.resolve(__dirname, './dist/externalLinkWarning.html'),
            chunks: ['warning']
        }),
        new HtmlWebpackPlugin({
            template: './src/warning/submissionApproval.html',
            filename: path.resolve(__dirname, './dist/submissionApproval.html'),
            chunks: ['warning']
        }),
        new HtmlWebpackPlugin({
            template: './src/legal/about_us.html',
            filename: path.resolve(__dirname, './dist/about_us.html'),
            chunks: ['legal']
        }),
        new HtmlWebpackPlugin({
            template: './src/legal/privacy_policy.html',
            filename: path.resolve(__dirname, './dist/privacy_policy.html'),
            chunks: ['legal']
        }),
        new HtmlWebpackPlugin({
            template: './src/legal/terms_of_services.html',
            filename: path.resolve(__dirname, './dist/terms_of_services.html'),
            chunks: ['legal']
        }),
        new HtmlWebpackPlugin({
            template: './src/warning/questResetWarning.html',
            filename: path.resolve(__dirname, './dist/questResetWarning.html'),
            chunks: ['warning']
        }),
        new HtmlWebpackPlugin({
            template: './src/marker_window/marker_properties.html',
            filename: path.resolve(__dirname, './dist/marker_properties.html'),
            chunks: ['marker_window']
        }),
        new HtmlWebpackPlugin({
            template: './src/quests_reminder/quests_reminder.html',
            filename: path.resolve(__dirname, './dist/quests_reminder.html'),
            chunks: ['quests_reminder']
        }),
        new HtmlWebpackPlugin({
            template: './src/setting/file_saver.html',
            filename: path.resolve(__dirname, './dist/file_saver.html'),
            chunks: ['quests_reminder']
        }),
        new HtmlWebpackPlugin({
            template: './src/setting/file_import.html',
            filename: path.resolve(__dirname, './dist/file_import.html'),
            chunks: ['quests_reminder']
        }),
        new HtmlWebpackPlugin({
            template: './src/warning/quest_completion_automation.html',
            filename: path.resolve(__dirname, './dist/quest_completion_automation.html'),
            chunks: ['warning']
        }),
        new HtmlWebpackPlugin({
            template: './src/setting/submission/review_and_submit.html',
            filename: path.resolve(__dirname, './dist/review_and_submit.html'),
            chunks: ['warning']
        }),
        new OverwolfPlugin(env)
    ]
})
