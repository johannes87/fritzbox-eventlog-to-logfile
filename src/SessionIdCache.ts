import path from 'path';
import fs from 'fs';

const SESSION_ID_CACHE_FILE_NAME = '.session_id_cache';

function getCachePath(): string {
    return path.resolve(process.cwd(), SESSION_ID_CACHE_FILE_NAME);
}

export function getLastSessionId(): string | undefined {
    let result;
    const cachePath = getCachePath();
    if (fs.existsSync(cachePath)) {
        result = fs.readFileSync(cachePath).toString();
    }
    return result;
}

export function writeLastSessionId(lastSessionId: string): void {
    const cachePath = getCachePath();
    fs.writeFileSync(cachePath, lastSessionId);
}
