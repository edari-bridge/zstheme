import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Opus 4.5 가격 (USD per 1M tokens)
const PRICING = {
  input: 15,
  output: 75,
  cacheRead: 1.875,
  cacheCreate: 18.75,
};

function formatNumber(num) {
  return num.toLocaleString('en-US');
}

function formatCurrency(num) {
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours} hours`;
}

// 문자열 디스플레이 너비 계산 (이모지, 한글 등은 2칸 차지)
function getDisplayWidth(str) {
  let width = 0;
  for (const char of str) {
    const code = char.codePointAt(0);
    // 이모지 범위
    if (code >= 0x1F300 && code <= 0x1FAD6) {
      width += 2;
    } else if (code >= 0x2600 && code <= 0x27BF) {
      width += 2;
    // 한글 범위
    } else if (code >= 0xAC00 && code <= 0xD7AF) {
      width += 2;
    // 한글 자모
    } else if (code >= 0x1100 && code <= 0x11FF) {
      width += 2;
    // CJK 통합 한자 등
    } else if (code >= 0x4E00 && code <= 0x9FFF) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

function padRight(str, len) {
  const displayWidth = getDisplayWidth(str);
  return str + ' '.repeat(Math.max(0, len - displayWidth));
}

function padLeft(str, len) {
  const displayWidth = getDisplayWidth(str);
  return ' '.repeat(Math.max(0, len - displayWidth)) + str;
}

export function cmdDashboard() {
  const statsPath = join(homedir(), '.claude', 'stats-cache.json');

  if (!existsSync(statsPath)) {
    console.log(chalk.yellow('⚠️  stats-cache.json not found'));
    console.log(chalk.dim('Run Claude Code to generate statistics.'));
    return;
  }

  let stats;
  try {
    stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
  } catch (e) {
    console.log(chalk.red('❌ Failed to parse stats-cache.json'));
    return;
  }

  // 데이터 추출
  const modelUsage = stats.modelUsage?.['claude-opus-4-5-20251101'] || {};
  const inputTokens = modelUsage.inputTokens || 0;
  const outputTokens = modelUsage.outputTokens || 0;
  const cacheRead = modelUsage.cacheReadInputTokens || 0;
  const cacheCreate = modelUsage.cacheCreationInputTokens || 0;
  const cacheTotal = cacheRead + cacheCreate;
  const totalTokens = inputTokens + outputTokens + cacheTotal;

  const totalSessions = stats.totalSessions || 0;

  // 기간 계산
  const dailyActivity = stats.dailyActivity || [];
  const dates = dailyActivity.map(d => d.date).sort();
  const days = dates.length || 1;

  // 비용 계산
  const inputCost = (inputTokens / 1_000_000) * PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * PRICING.output;
  const cacheReadCost = (cacheRead / 1_000_000) * PRICING.cacheRead;
  const cacheCreateCost = (cacheCreate / 1_000_000) * PRICING.cacheCreate;
  const totalCost = inputCost + outputCost + cacheReadCost + cacheCreateCost;

  // 일일 평균
  const dailyAvgCost = totalCost / days;
  const dailyAvgTokens = totalTokens / days;

  // 월간 추정
  const estMonthly = dailyAvgCost * 30;

  // 효율성
  const efficiency = totalCost > 0 ? Math.round(totalTokens / totalCost) : 0;

  // O/I 비율
  const oiRatio = inputTokens > 0 ? (outputTokens / inputTokens).toFixed(1) : '0';

  // 캐시 히트율
  const cacheHitRate = (inputTokens + cacheCreate) > 0
    ? ((cacheRead / (inputTokens + cacheCreate)) * 100).toFixed(1)
    : '0';

  // 박스 그리기
  const W = 72;
  const TOP = '┌' + '─'.repeat(W) + '┐';
  const MID = '├' + '─'.repeat(W) + '┤';
  const BOT = '└' + '─'.repeat(W) + '┘';

  const row = (content) => {
    const displayWidth = getDisplayWidth(content);
    const pad = Math.max(0, W - displayWidth);
    return '│ ' + content + ' '.repeat(pad) + '│';
  };

  console.log('');
  console.log(chalk.cyan(TOP));
  console.log(chalk.cyan(row(chalk.bold('💰 COST & USAGE SUMMARY'))));
  console.log(chalk.cyan(MID));

  // Row 1: Total Cost | Period | Total Tokens
  const r1 = `💵 Total Cost: ${chalk.yellow(formatCurrency(totalCost))}  │  📅 Period: ${chalk.white(days + ' days')}  │  🎯 Total Tokens: ${chalk.white(formatNumber(totalTokens))}`;
  console.log(chalk.cyan(row(r1)));

  // Row 2: Input | Output | Cache
  const r2 = `📥 Input: ${chalk.white(formatNumber(inputTokens))}  │  📤 Output: ${chalk.white(formatNumber(outputTokens))}  │  💾 Cache: ${chalk.white(formatNumber(cacheTotal))}`;
  console.log(chalk.cyan(row(r2)));

  console.log(chalk.cyan(MID));

  // Row 3: Efficiency | O/I Ratio | Cache Hit
  const r3 = `⚡ Efficiency: ${chalk.white(formatNumber(efficiency) + ' tok/$')}  │  📊 O/I Ratio: ${chalk.white(oiRatio + ':1')}  │  🎯 Cache Hit: ${chalk.white(cacheHitRate + '%')}`;
  console.log(chalk.cyan(row(r3)));

  // Row 4: Daily Avg | Est. Monthly
  const r4 = `📆 Daily Avg: ${chalk.white(formatCurrency(dailyAvgCost))} (${formatNumber(Math.round(dailyAvgTokens))} tokens)  │  💡 Est. Monthly: ${chalk.yellow(formatCurrency(estMonthly))}`;
  console.log(chalk.cyan(row(r4)));

  console.log(chalk.cyan(BOT));
  console.log('');
}

export function cmdStats() {
  const statsPath = join(homedir(), '.claude', 'stats-cache.json');

  if (!existsSync(statsPath)) {
    console.log('');
    console.log(chalk.yellow('stats-cache.json not found at ~/.claude/stats-cache.json'));
    console.log(chalk.dim('Run Claude Code to generate usage statistics.'));
    console.log('');
    return;
  }

  let stats;
  try {
    stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
  } catch (e) {
    console.log('');
    console.log(chalk.red('Failed to parse stats-cache.json'));
    console.log('');
    return;
  }

  // 데이터 추출
  const modelUsage = stats.modelUsage?.['claude-opus-4-5-20251101'] || {};
  const inputTokens = modelUsage.inputTokens || 0;
  const outputTokens = modelUsage.outputTokens || 0;
  const cacheRead = modelUsage.cacheReadInputTokens || 0;
  const cacheCreate = modelUsage.cacheCreationInputTokens || 0;
  const totalTokens = inputTokens + outputTokens + cacheRead + cacheCreate;

  const totalSessions = stats.totalSessions || 0;
  const totalMessages = stats.totalMessages || 0;

  // 기간 계산
  const dailyActivity = stats.dailyActivity || [];
  const dates = dailyActivity.map(d => d.date).sort();
  const startDate = dates[0] || 'N/A';
  const endDate = dates[dates.length - 1] || 'N/A';
  const days = dates.length || 1;

  // 첫 세션 시작 시간
  const firstSessionRaw = stats.firstSessionDate || null;
  const firstSession = firstSessionRaw
    ? new Date(firstSessionRaw).toLocaleString('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(',', '')
    : 'N/A';

  // 비용 계산
  const inputCost = (inputTokens / 1_000_000) * PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * PRICING.output;
  const cacheReadCost = (cacheRead / 1_000_000) * PRICING.cacheRead;
  const cacheCreateCost = (cacheCreate / 1_000_000) * PRICING.cacheCreate;
  const totalCost = inputCost + outputCost + cacheReadCost + cacheCreateCost;

  // 일일 평균
  const dailyAvgCost = totalCost / days;
  const dailyAvgTokens = totalTokens / days;
  const dailyAvgMessages = totalMessages / days;

  // 월간 추정
  const estMonthly = dailyAvgCost * 30;

  // 효율성
  const efficiency = totalCost > 0 ? Math.round(totalTokens / totalCost) : 0;

  // O/I 비율
  const oiRatio = inputTokens > 0 ? (outputTokens / inputTokens).toFixed(1) : '0';

  // 캐시 히트율 (cache read / (input + cache create))
  const cacheHitRate = (inputTokens + cacheCreate) > 0
    ? Math.round((cacheRead / (inputTokens + cacheCreate)) * 100)
    : 0;

  // Longest session
  const longest = stats.longestSession || {};
  const longestMessages = longest.messageCount || 0;
  const longestDuration = longest.duration || 0;
  const longestHours = Math.round(longestDuration / (1000 * 60 * 60));

  // Tool Calls 총합
  const totalToolCalls = dailyActivity.reduce((sum, d) => sum + (d.toolCallCount || 0), 0);

  // 시간대별 활동 분석
  const hourCounts = stats.hourCounts || {};
  const hourEntries = Object.entries(hourCounts).map(([h, c]) => [parseInt(h), c]);

  // Peak hour 찾기
  let peakHour = 0;
  let peakCount = 0;
  for (const [hour, count] of hourEntries) {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  }

  // 시간대별 그룹 (4시간 단위)
  const hourGroups = [
    { label: '00-05', hours: [0, 1, 2, 3, 4, 5], count: 0 },
    { label: '06-11', hours: [6, 7, 8, 9, 10, 11], count: 0 },
    { label: '12-17', hours: [12, 13, 14, 15, 16, 17], count: 0 },
    { label: '18-23', hours: [18, 19, 20, 21, 22, 23], count: 0 },
  ];

  for (const [hour, count] of hourEntries) {
    for (const group of hourGroups) {
      if (group.hours.includes(hour)) {
        group.count += count;
        break;
      }
    }
  }

  const maxGroupCount = Math.max(...hourGroups.map(g => g.count), 1);

  // 막대 그래프 생성 함수
  const makeBar = (count, max, width = 10) => {
    const filled = Math.round((count / max) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };

  // 일별 토큰 사용량 (최근 7일)
  const dailyModelTokens = stats.dailyModelTokens || [];
  const recentTokens = dailyModelTokens
    .slice(-7)
    .map(d => {
      const tokens = Object.values(d.tokensByModel || {}).reduce((a, b) => a + b, 0);
      return { date: d.date, tokens };
    });

  const maxDailyTokens = Math.max(...recentTokens.map(d => d.tokens), 1);

  // 세로 막대 그래프 생성 (높이 5)
  const barHeight = 5;
  const barChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  const getBarChar = (value, max) => {
    if (value === 0) return ' ';
    const ratio = value / max;
    const index = Math.min(Math.floor(ratio * barChars.length), barChars.length - 1);
    return barChars[index];
  };

  // 박스 그리기
  const W = 68; // 박스 내부 너비
  const TOP = '╔' + '═'.repeat(W) + '╗';
  const MID = '╠' + '═'.repeat(W) + '╣';
  const BOT = '╚' + '═'.repeat(W) + '╝';
  const DIV = '║  ' + '─'.repeat(W - 4) + '  ║';

  const line = (content) => '║' + padRight('  ' + content, W) + '║';
  const center = (content) => {
    const displayWidth = getDisplayWidth(content);
    const pad = Math.max(0, W - displayWidth);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return '║' + ' '.repeat(left) + content + ' '.repeat(right) + '║';
  };

  const valueLine = (label, value) => {
    const labelPart = padRight(label, 22);
    const valuePart = padLeft(value, 40);
    return '║  ' + labelPart + valuePart + '  ║';
  };

  console.log('');
  console.log(chalk.cyan(TOP));
  console.log(chalk.cyan(center('📊 USAGE SUMMARY')));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(valueLine('📅 Period:', `${startDate} ~ ${endDate} (${days} days)`)));
  console.log(chalk.cyan(valueLine('🕐 First Session:', firstSession)));
  console.log(chalk.cyan(valueLine('📁 Sessions:', formatNumber(totalSessions))));
  console.log(chalk.cyan(valueLine('💬 Messages:', formatNumber(totalMessages))));
  console.log(chalk.cyan(valueLine('🔧 Tool Calls:', formatNumber(totalToolCalls))));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(center('TOKEN USAGE')));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(valueLine('📥 Input:', formatNumber(inputTokens))));
  console.log(chalk.cyan(valueLine('📤 Output:', formatNumber(outputTokens))));
  console.log(chalk.cyan(valueLine('💾 Cache Read:', formatNumber(cacheRead))));
  console.log(chalk.cyan(valueLine('🔨 Cache Create:', formatNumber(cacheCreate))));
  console.log(chalk.cyan(DIV));
  console.log(chalk.cyan(valueLine('📊 Total Tokens:', formatNumber(totalTokens))));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(center('💰 ESTIMATED COST (Opus 4.5)')));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(valueLine('📥 Input:', formatCurrency(inputCost))));
  console.log(chalk.cyan(valueLine('📤 Output:', formatCurrency(outputCost))));
  console.log(chalk.cyan(valueLine('💾 Cache Read:', formatCurrency(cacheReadCost))));
  console.log(chalk.cyan(valueLine('🔨 Cache Create:', formatCurrency(cacheCreateCost))));
  console.log(chalk.cyan(DIV));
  console.log(chalk.yellow(valueLine('💵 Total:', formatCurrency(totalCost))));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(center('📈 STATS')));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(valueLine('📆 Daily Avg Cost:', formatCurrency(dailyAvgCost))));
  console.log(chalk.cyan(valueLine('📆 Daily Avg Tokens:', formatNumber(Math.round(dailyAvgTokens)))));
  console.log(chalk.cyan(valueLine('📆 Daily Avg Messages:', formatNumber(Math.round(dailyAvgMessages)))));
  console.log(chalk.cyan(valueLine('📅 Est. Monthly:', formatCurrency(estMonthly))));
  console.log(chalk.cyan(valueLine('⚡ Efficiency:', `${formatNumber(efficiency)} tok/$`)));
  console.log(chalk.cyan(valueLine('🎯 O/I Ratio:', `${oiRatio}:1`)));
  console.log(chalk.cyan(valueLine('💾 Cache Hit Rate:', `${cacheHitRate}%`)));
  console.log(chalk.cyan(valueLine('🏆 Longest Session:', `${formatNumber(longestMessages)} messages / ${longestHours} hours`)));
  console.log(chalk.cyan(MID));
  console.log(chalk.cyan(center('⏰ ACTIVITY BY HOUR')));
  console.log(chalk.cyan(MID));

  // 시간대별 막대 그래프 출력
  const bar1 = `00-05: ${makeBar(hourGroups[0].count, maxGroupCount)}`;
  const bar2 = `06-11: ${makeBar(hourGroups[1].count, maxGroupCount)}`;
  const bar3 = `12-17: ${makeBar(hourGroups[2].count, maxGroupCount)}`;
  const bar4 = `18-23: ${makeBar(hourGroups[3].count, maxGroupCount)}`;

  // 두 줄로 나눠서 출력 (각 막대 + 간격)
  const activityLine1 = `${bar1}    ${bar2}`;
  const activityLine2 = `${bar3}    ${bar4}`;

  console.log(chalk.cyan('║  ' + padRight(activityLine1, W - 4) + '  ║'));
  console.log(chalk.cyan('║  ' + padRight(activityLine2, W - 4) + '  ║'));
  console.log(chalk.cyan(valueLine('🕐 Peak Hour:', `${String(peakHour).padStart(2, '0')}:00 (${peakCount} sessions)`)));

  // 최근 7일 토큰 추이 그래프
  if (recentTokens.length > 0) {
    console.log(chalk.cyan(MID));
    console.log(chalk.cyan(center('📊 DAILY TOKENS (Last 7 days)')));
    console.log(chalk.cyan(MID));

    // 막대 그래프 라인
    const bars = recentTokens.map(d => getBarChar(d.tokens, maxDailyTokens));
    const dates = recentTokens.map(d => d.date.slice(5, 10)); // MM-DD 형식

    // 그래프 출력 (막대)
    const graphLine = bars.map(b => ` ${b} `).join('');
    const dateLine = dates.map(d => d).join(' ');

    // 최대/최소 토큰
    const maxT = Math.max(...recentTokens.map(d => d.tokens));
    const minT = Math.min(...recentTokens.map(d => d.tokens));

    console.log(chalk.cyan('║  ' + padRight(graphLine, W - 4) + '  ║'));
    console.log(chalk.cyan('║  ' + padRight(dateLine, W - 4) + '  ║'));
    console.log(chalk.cyan(DIV));
    console.log(chalk.cyan(valueLine('📈 Max:', formatNumber(maxT))));
    console.log(chalk.cyan(valueLine('📉 Min:', formatNumber(minT))));
  }

  console.log(chalk.cyan(BOT));
  console.log('');
}
