import puppeteer from 'puppeteer';
import { getLastSessionId, writeLastSessionId } from './SessionIdCache.js';
import { Configuration } from './types/Configuration.js';
import { getConfiguration } from './Configuration.js';
import { EventLogEntry } from './types/EventLogEntry.js';
import { writeLogFile } from './LogFileWriter.js';

async function getSessionId(configuration: Configuration): Promise<string> {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.goto(configuration.fritzBoxUrl);
    await page.setViewport({ width: 1080, height: 1024 });

    const element = await page.waitForSelector('#uiPassInput');
    await element?.type(configuration.fritzBoxPassword);

    const loginButton = await page.waitForSelector('#submitLoginBtn');
    await loginButton?.click();

    await page.waitForFunction(
        "typeof main === 'object' && main?.sid?.length > 0"
    );

    const sessionId = (await page.evaluate('main.sid'))?.toString();
    if (!sessionId || sessionId?.length === 0) {
        throw new Error(`Unexpected session ID received: ${sessionId}`);
    }
    await browser.close();
    return sessionId;
}

async function getEventLog(
    configuration: Configuration,
    sessionId: string
): Promise<EventLogEntry[] | undefined> {
    const response = await fetch(`${configuration.fritzBoxUrl}/data.lua`, {
        headers: {
            accept: '*/*',
            'accept-language':
                'en-DE,en;q=0.9,de-DE;q=0.8,de;q=0.7,en-GB;q=0.6,en-US;q=0.5',
            'content-type': 'application/x-www-form-urlencoded',
            Referer: `${configuration.fritzBoxUrl}/`,
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: `xhr=1&sid=${sessionId}&lang=en&page=log&xhrId=all`,
        method: 'POST',
    });
    let eventLog: EventLogEntry[] | undefined;
    try {
        const responseJson = await response.json();
        eventLog = responseJson?.data?.log;
    } catch {
        // This happens if we don't have a valid session id. In this case,
        // undefined is returned.
    }
    if (eventLog) {
        // Make newest log entry the last entry in the array
        eventLog.reverse();
    }
    return eventLog;
}

async function main() {
    const configuration = getConfiguration();
    let sessionId = getLastSessionId();
    try {
        if (!sessionId) {
            // Session ID cache is empty, so we need to initially fill it
            sessionId = await getSessionId(configuration);
            writeLastSessionId(sessionId);
        }
        let eventLog = await getEventLog(configuration, sessionId);

        if (!eventLog) {
            // Our cached session ID did not work, so we get a new one
            sessionId = await getSessionId(configuration);
            writeLastSessionId(sessionId);
            eventLog = await getEventLog(configuration, sessionId);
        }

        if (!eventLog) {
            // We should have an event log now, but somehow we don't
            throw new Error(
                'Could not get event log after renewing session ID'
            );
        }

        writeLogFile(configuration, eventLog);
    } catch (error) {
        console.error(error);
    }
}

await main();
