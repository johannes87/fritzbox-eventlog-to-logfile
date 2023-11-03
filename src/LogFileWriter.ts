import fs from 'fs/promises';
import { DateTime } from 'luxon';
import eol from 'eol';
import { Configuration } from './types/Configuration.js';
import { EventLogEntry } from './types/EventLogEntry.js';

function getDateTimeFromLog(date: string, time: string): DateTime {
    return DateTime.fromFormat(`${date} ${time}`, 'dd.MM.yy HH:mm:ss');
}

async function getDateTimeOfNewestLogFileEntry(
    configuration: Configuration
): Promise<DateTime | null> {
    let newestDateTime: DateTime | null = null;

    try {
        const fileContents = await fs.readFile(configuration.logFilePath);
        const logFileLines = eol.split(fileContents.toString());
        for (const line of logFileLines) {
            const [date, time] = line.split(/\s+/);
            const lineDateTime = getDateTimeFromLog(date, time);
            if (newestDateTime === null || lineDateTime > newestDateTime) {
                newestDateTime = lineDateTime;
            }
        }
    } catch {
        newestDateTime = null;
    }

    return newestDateTime;
}

export async function writeLogFile(
    configuration: Configuration,
    eventLog: EventLogEntry[]
) {
    const newestLogFileDateTime = await getDateTimeOfNewestLogFileEntry(
        configuration
    );
    for (const eventLogEntry of eventLog) {
        const dateTime = getDateTimeFromLog(
            eventLogEntry.date,
            eventLogEntry.time
        );
        if (
            newestLogFileDateTime === null ||
            dateTime > newestLogFileDateTime
        ) {
            await fs.appendFile(
                configuration.logFilePath,
                `${eventLogEntry.date} ${eventLogEntry.time} ${eventLogEntry.msg}\n`
            );
        }
    }
}
