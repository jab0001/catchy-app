module.exports = {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
        ['module:react-native-dotenv', {
            moduleName: '@env',
            path: '.env', // Можно указать путь к вашему .env файлу
            blocklist: null,
            allowlist: null,
            safe: false,
            allowUndefined: true,
        }],
        ['module-resolver', {
            root: ['./src'],
        }],
    ],
};