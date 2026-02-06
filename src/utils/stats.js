import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { PRICING, MODEL_ID, formatNumber, formatCurrency } from '../constants.js';
import { cmdDashboard, cmdStats } from '../commands/usage.js';

// console.log 캡처로 대시보드 프리뷰 가져오기
export function getDashboardPreview(type = 'simple') {
  const originalLog = console.log;

  try {
    const logs = [];
    console.log = (...args) => logs.push(args.join(' '));

    if (type === 'full') {
      cmdStats();
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

    const modelUsage = stats.modelUsage?.[MODEL_ID] || {};
    const inputTokens = modelUsage.inputTokens || 0;
    const outputTokens = modelUsage.outputTokens || 0;
    const cacheRead = modelUsage.cacheReadInputTokens || 0;
    const cacheCreate = modelUsage.cacheCreationInputTokens || 0;
    const cacheTotal = cacheRead + cacheCreate;
    const totalTokens = inputTokens + outputTokens + cacheTotal;

    const dailyActivity = stats.dailyActivity || [];
    const dates = dailyActivity.map(d => d.date).sort();
    const days = dates.length || 1;
    const startDate = dates[0] || 'N/A';
    const endDate = dates[dates.length - 1] || 'N/A';

    const inputCost = (inputTokens / 1_000_000) * PRICING.input;
    const outputCost = (outputTokens / 1_000_000) * PRICING.output;
    const cacheReadCost = (cacheRead / 1_000_000) * PRICING.cacheRead;
    const cacheCreateCost = (cacheCreate / 1_000_000) * PRICING.cacheCreate;
    const totalCost = inputCost + outputCost + cacheReadCost + cacheCreateCost;

    const dailyAvgCost = totalCost / days;
    const dailyAvgTokens = totalTokens / days;
    const estMonthly = dailyAvgCost * 30;

    const efficiency = totalCost > 0 ? Math.round(totalTokens / totalCost) : 0;
    const oiRatio = inputTokens > 0 ? (outputTokens / inputTokens).toFixed(1) : '0';
    const cacheHitRate = (inputTokens + cacheCreate) > 0
      ? ((cacheRead / (inputTokens + cacheCreate)) * 100).toFixed(1)
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
      inputCost,
      outputCost,
      cacheReadCost,
      cacheCreateCost,
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
