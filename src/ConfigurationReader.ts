import { Configuration } from './types/Configuration.js';

function getRequiredEnvValue(envVariableName: string): string {
    const envValue = process.env[envVariableName];
    if (!envValue) {
        throw new Error(`${envVariableName} env variable not defined`);
    }
    return envValue;
}

export function getConfiguration(): Configuration {
    const fritzBoxUrl = getRequiredEnvValue('FRITZ_BOX_URL');
    const fritzBoxUrlWithoutTrailingSlash = fritzBoxUrl.replace(/\/$/, '');

    const fritzBoxPassword = getRequiredEnvValue('FRITZ_BOX_PASSWORD');
    const logFilePath = getRequiredEnvValue('LOG_FILE_PATH');
    const puppeteerExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    return {
        fritzBoxUrl: fritzBoxUrlWithoutTrailingSlash,
        fritzBoxPassword,
        logFilePath,
        puppeteerExecutablePath,
    };
}
