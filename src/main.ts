import puppeteer from 'puppeteer';

interface EventLogEntry {
    date: string;
    time: string;
    msg: string;
}

interface Configuration {
    fritzBoxUrl: string;
    password: string;
}

/**
 * Get the session ID from fritzbox.
 * @param {string} fritzBoxUrl the HTTP URL to the fritzbox, without a trailing '/'
 * @param {string} password the password for fritzbox
 * @returns {Promise<string>} the session id
 */
async function getSessionId(
    fritzBoxUrl: string,
    password: string
): Promise<string> {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.goto(fritzBoxUrl);
    await page.setViewport({ width: 1080, height: 1024 });

    const element = await page.waitForSelector('#uiPassInput');
    await element?.type(password);

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

/**
 * Get the event log from fritzbox.
 * @param fritzBoxUrl the HTTP URL to the fritzbox, without a trailing '/'
 * @param sessionId the session ID
 * @returns the event log
 */
async function getEventLog(
    fritzBoxUrl: string,
    sessionId: string
): Promise<EventLogEntry[]> {
    const response = await fetch(`${fritzBoxUrl}/data.lua`, {
        headers: {
            accept: '*/*',
            'accept-language':
                'en-DE,en;q=0.9,de-DE;q=0.8,de;q=0.7,en-GB;q=0.6,en-US;q=0.5',
            'content-type': 'application/x-www-form-urlencoded',
            Referer: `${fritzBoxUrl}/`,
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
        body: `xhr=1&sid=${sessionId}&lang=en&page=log&xhrId=all`,
        method: 'POST',
    });
    const responseJson = await response.json();
    const result = responseJson?.data?.log;
    if (!result) {
        throw new Error(
            `Unexpected JSON response, expected structure: {data: {log: ...}}. Received data: ${responseJson}`
        );
    }
    return result;
}

function printEventLog(eventLog: EventLogEntry[]) {
    for (const log of eventLog) {
        console.log(`${log.date} ${log.time} ${log.msg}`);
    }
}

function getConfiguration(): Configuration {
    const fritzBoxUrl = process.env.FRITZ_BOX_URL;
    if (!fritzBoxUrl) {
        throw new Error('FRITZ_BOX_URL env variable not defined');
    }
    const fritzBoxUrlWithoutTrailingSlash = fritzBoxUrl.replace(/\/$/, '');
    const password = process.env.FRITZ_BOX_PASSWORD;
    if (!password) {
        throw new Error('FRITZ_BOX_PASSWORD env variable not defined');
    }
    return { fritzBoxUrl: fritzBoxUrlWithoutTrailingSlash, password };
}

async function main() {
    try {
        const configuration = getConfiguration();
        const sessionId = await getSessionId(
            configuration.fritzBoxUrl,
            configuration.password
        );
        const eventLog = await getEventLog(
            configuration.fritzBoxUrl,
            sessionId
        );
        printEventLog(eventLog);
    } catch (error) {
        console.error(error);
    }
}

await main();
