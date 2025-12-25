export type LogType = 'chat' | 'embed';
export type LogStatus = 'ok' | 'fail';

export interface LogEntry {
    id: string;
    timestamp: string; // ISO string
    type: LogType;
    status: LogStatus;
    latencyMs: number;
    model?: string;
    error?: string;
}

export interface Stats {
    totalRequests: number;
    successCount: number;
    failCount: number;
    successRate: number; // 0-100
    avgLatencyMs: number;
    logs: LogEntry[];
}

// In-memory storage (resets on server restart)
const MAX_LOGS = 50;
const logs: LogEntry[] = [];
let totalRequests = 0;
let successCount = 0;
let failCount = 0;
let totalLatency = 0;

export function logRequest(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const fullEntry: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        ...entry,
    };

    // Add to logs (FIFO)
    logs.unshift(fullEntry);
    if (logs.length > MAX_LOGS) {
        logs.pop();
    }

    // Update stats
    totalRequests++;
    if (entry.status === 'ok') {
        successCount++;
        totalLatency += entry.latencyMs;
    } else {
        failCount++;
    }

    // Keep console log for server-side debugging
    console.log(`[${fullEntry.timestamp}] ${entry.type.toUpperCase()} ${entry.status} (${entry.latencyMs}ms) ${entry.model || ''}`);
}

export function getStats(): Stats {
    const successRate = totalRequests === 0 ? 100 : (successCount / totalRequests) * 100;
    // Calculate average latency only for successful requests to avoid skewing
    const avgLatency = successCount === 0 ? 0 : Math.round(totalLatency / successCount);

    return {
        totalRequests,
        successCount,
        failCount,
        successRate: parseFloat(successRate.toFixed(1)),
        avgLatencyMs: avgLatency,
        logs,
    };
}
