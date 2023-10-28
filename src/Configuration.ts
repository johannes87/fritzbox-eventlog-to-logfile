import { Configuration } from './types/Configuration.js';

export function getConfiguration(): Configuration {
    const fritzBoxUrl = process.env.FRITZ_BOX_URL;
    if (!fritzBoxUrl) {
        throw new Error('FRITZ_BOX_URL env variable not defined');
    }
    const fritzBoxUrlWithoutTrailingSlash = fritzBoxUrl.replace(/\/$/, '');
    const fritzBoxPassword = process.env.FRITZ_BOX_PASSWORD;
    if (!fritzBoxPassword) {
        throw new Error('FRITZ_BOX_PASSWORD env variable not defined');
    }
    const logFilePath = process.env.LOG_FILE_PATH;
    if (!logFilePath) {
        throw new Error('LOG_FILE_PATH env variable not defined');
    }
    return {
        fritzBoxUrl: fritzBoxUrlWithoutTrailingSlash,
        fritzBoxPassword,
        logFilePath,
    };
}
