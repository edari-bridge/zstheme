import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { aggregateModelUsage, formatNumber, formatCurrency } from '../constants.js';
import { cmdDashboard, cmdStats, loadRateLimitAsync } from '../commands/usage.js';

export { loadRateLimitAsync };

// console.log 캡처로 대시보드 프리뷰 가져오기
export function getDashboardPreview(type = 'simple', options = {}) {
  const originalLog = console.log;

  try {
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));

    if (type === 'full') {
      cmdStats(options);
    } else {
      cmdDashboard();
    }

    return logs.join('\n');
  } catch (err) {
    return `Failed to load: ${err.message}`;
  } finally {
    console.log = originalLog;
  }
}

export function getUsageStats() {
  const statsPath = join(homedir(), '.claude', 'stats-cache.json');

  if (!existsSync(statsPath)) {
    return null;
  }

  try {
    const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));

    const agg = aggregateModelUsage(stats.modelUsage);
    const inputTokens = agg.inputTokens;
    const outputTokens = agg.outputTokens;
    const cacheRead = agg.cacheRead;
    const cacheCreate = agg.cacheCreate;
    const cacheTotal = cacheRead + cacheCreate;
    const totalTokens = inputTokens + outputTokens + cacheTotal;
    const totalCost = agg.cost;

    const dailyActivity = stats.dailyActivity || [];
    const dates = dailyActivity.map(d => d.date).sort();
    const days = dates.length || 1;
    const startDate = dates[0] || 'N/A';
    const endDate = dates[dates.length - 1] || 'N/A';

    const dailyAvgCost = totalCost / days;
    const dailyAvgTokens = totalTokens / days;
    const estMonthly = dailyAvgCost * 30;

    const efficiency = totalCost > 0 ? Math.round(totalTokens / totalCost) : 0;
    const oiRatio = inputTokens > 0 ? (outputTokens / inputTokens).toFixed(1) : '0';
    const cacheHitRate = (cacheRead + inputTokens) > 0
      ? ((cacheRead / (cacheRead + inputTokens)) * 100).toFixed(1)
      : '0';

    const totalSessions = stats.totalSessions || 0;
    const totalMessages = stats.totalMessages || 0;

    return {
      totalCost,
      days,
      startDate,
      endDate,
      totalTokens,
      inputTokens,
      outputTokens,
      cacheRead,
      cacheCreate,
      cacheTotal,
      efficiency,
      oiRatio,
      cacheHitRate,
      dailyAvgCost,
      dailyAvgTokens,
      estMonthly,
      totalSessions,
      totalMessages,
    };
  } catch (e) {
    return null;
  }
}
