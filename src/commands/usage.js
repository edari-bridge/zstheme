import chalk from 'chalk';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { execSync, exec } from 'child_process';
import { aggregateModelUsage, getLatestModelName, formatNumber, formatCurrency } from '../constants.js';

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

// Rate Limit 캐시
let _rateLimitCache = { loaded: false, data: null };

function parseRateLimitData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    const blocks = data.blocks || [];
    const activeBlock = blocks.find(b => b.projection) || blocks[0];
    if (!activeBlock) return null;

    const costUSD = activeBlock.costUSD || 0;
    const projection = activeBlock.projection;
    const burnRate = activeBlock.burnRate;
    const resetAt = activeBlock.resetAt;

    let ratePct = null;
    if (projection?.totalCost) {
      ratePct = Math.round((costUSD / projection.totalCost) * 100);
    }

    let timeLeft = null;
    if (projection?.remainingMinutes) {
      const mins = projection.remainingMinutes;
      timeLeft = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
    }

    let resetTime = null;
    if (resetAt) {
      resetTime = new Date(resetAt).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
    }

    let burnRateStr = null;
    if (burnRate?.costPerHour) {
      burnRateStr = `$${burnRate.costPerHour.toFixed(2)}/h`;
    }

    return { costUSD, ratePct, timeLeft, resetTime, burnRateStr };
  } catch {
    return null;
  }
}

// 동기 호출 (CLI 전용, 캐시 활용)
function getRateLimitInfo() {
  if (_rateLimitCache.loaded) return _rateLimitCache.data;
  try {
    const result = execSync('npx ccusage blocks --json', {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    _rateLimitCache = { loaded: true, data: parseRateLimitData(result) };
  } catch {
    _rateLimitCache = { loaded: true, data: null };
  }
  return _rateLimitCache.data;
}

// 비동기 호출 (Dashboard UI용)
export function loadRateLimitAsync() {
  return new Promise((resolve) => {
    exec('npx ccusage blocks --json', {
      encoding: 'utf-8',
      timeout: 10000,
    }, (err, stdout) => {
      _rateLimitCache = {
        loaded: true,
        data: (!err && stdout) ? parseRateLimitData(stdout) : null,
      };
      resolve(_rateLimitCache.data);
    });
  });
}

// 현재 세션 정보 가져오기
function getCurrentSessionInfo() {
  try {
    // 현재 디렉토리 기반 프로젝트 경로 찾기
    const cwd = process.cwd().replace(/\//g, '-').replace(/^-/, '');
    const projectsDir = join(homedir(), '.claude', 'projects');

    if (!existsSync(projectsDir)) return null;

    // 프로젝트 폴더 찾기 (exact match 우선, fallback은 가장 긴 매칭)
    const dirs = readdirSync(projectsDir);
    const projectDir = dirs.find(d => d.slice(1) === cwd)
      || dirs.filter(d => cwd.includes(d.slice(1)) || d.slice(1).includes(cwd))
              .sort((a, b) => b.length - a.length)[0]
      || null;

    if (!projectDir) return null;

    const projectPath = join(projectsDir, projectDir);

    // 가장 최근 세션 파일 찾기
    const files = readdirSync(projectPath)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({
        name: f,
        path: join(projectPath, f),
        mtime: statSync(join(projectPath, f)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) return null;

    const latestSession = files[0];
    const content = readFileSync(latestSession.path, 'utf-8');
    const lines = content.trim().split('\n');

    // 메시지 수 카운트
    let userMessages = 0;
    let assistantMessages = 0;
    let firstTimestamp = null;
    let lastTimestamp = null;

    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'user') userMessages++;
        if (msg.type === 'assistant') assistantMessages++;
        if (msg.timestamp) {
          if (!firstTimestamp) firstTimestamp = msg.timestamp;
          lastTimestamp = msg.timestamp;
        }
      } catch (e) {}
    }

    // 세션 경과 시간
    let duration = null;
    if (firstTimestamp) {
      const start = new Date(firstTimestamp);
      const now = new Date();
      const diffMs = now - start;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins >= 60) {
        duration = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
      } else {
        duration = `${diffMins}m`;
      }
    }

    return {
      messages: userMessages + assistantMessages,
      userMessages,
      assistantMessages,
      duration,
      sessionFile: latestSession.name.replace('.jsonl', '').slice(0, 8),
    };
  } catch (e) {
    return null;
  }
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

  // 전체 모델 합산
  const agg = aggregateModelUsage(stats.modelUsage);
  const inputTokens = agg.inputTokens;
  const outputTokens = agg.outputTokens;
  const cacheRead = agg.cacheRead;
  const cacheCreate = agg.cacheCreate;
  const cacheTotal = cacheRead + cacheCreate;
  const totalTokens = inputTokens + outputTokens + cacheTotal;
  const totalCost = agg.cost;

  const totalSessions = stats.totalSessions || 0;

  // 기간 계산
  const dailyActivity = stats.dailyActivity || [];
  const dates = dailyActivity.map(d => d.date).sort();
  const days = dates.length || 1;

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
  const cacheHitRate = (cacheRead + inputTokens) > 0
    ? ((cacheRead / (cacheRead + inputTokens)) * 100).toFixed(1)
    : '0';

  // 박스 그리기
  const W = 72;
  const TOP = '┌' + '─'.repeat(W) + '┐';
  const MID = '├' + '─'.repeat(W) + '┤';
  const BOT = '└' + '─'.repeat(W) + '┘';

  const row = (content) => {
    const stripped = content.replace(/\x1b\[[0-9;]*m/g, '');
    const displayWidth = getDisplayWidth(stripped);
    const pad = Math.max(0, W - displayWidth - 1);
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

export function cmdStats({ skipRateLimit = false, maxWidth, borderColor } = {}) {
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

  // 전체 모델 합산
  const agg = aggregateModelUsage(stats.modelUsage);
  const modelName = getLatestModelName(stats.modelUsage);
  const inputTokens = agg.inputTokens;
  const outputTokens = agg.outputTokens;
  const cacheRead = agg.cacheRead;
  const cacheCreate = agg.cacheCreate;
  const totalTokens = inputTokens + outputTokens + cacheRead + cacheCreate;
  const totalCost = agg.cost;
  const inputCost = agg.inputCost;
  const outputCost = agg.outputCost;
  const cacheReadCost = agg.cacheReadCost;
  const cacheCreateCost = agg.cacheCreateCost;

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

  // 캐시 히트율 (cache read / (cache read + input))
  const cacheHitRate = (cacheRead + inputTokens) > 0
    ? Math.round((cacheRead / (cacheRead + inputTokens)) * 100)
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

  // 박스 그리기 (maxWidth가 있으면 프리뷰 영역에 맞춤)
  const bc = borderColor ? chalk.keyword(borderColor) : chalk.cyan;
  const W = maxWidth ? Math.max(50, maxWidth - 2) : 68; // 내부 너비 (-2 for ║ borders)
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

  const valueW = W - 4; // ║ + 2 spaces each side
  const labelW = Math.min(22, Math.floor(valueW * 0.35));
  const dataW = valueW - labelW;
  const valueLine = (label, value) => {
    const labelPart = padRight(label, labelW);
    const valuePart = padLeft(value, dataW);
    return '║  ' + labelPart + valuePart + '  ║';
  };

  // 막대 그래프 생성 함수 (W에 맞춰 동적 너비)
  const barWidth = Math.max(5, Math.floor((W - 30) / 2));
  const makeBar = (count, max, bw = barWidth) => {
    const filled = Math.round((count / max) * bw);
    return '█'.repeat(filled) + '░'.repeat(bw - filled);
  };

  console.log('');
  console.log(bc(TOP));
  console.log(bc(center('📊 USAGE SUMMARY')));
  console.log(bc(MID));
  console.log(bc(valueLine('📅 Period:', `${startDate} ~ ${endDate} (${days} days)`)));
  console.log(bc(valueLine('🕐 First Session:', firstSession)));
  console.log(bc(valueLine('📁 Sessions:', formatNumber(totalSessions))));
  console.log(bc(valueLine('💬 Messages:', formatNumber(totalMessages))));
  console.log(bc(valueLine('🔧 Tool Calls:', formatNumber(totalToolCalls))));
  console.log(bc(MID));
  console.log(bc(center('TOKEN USAGE')));
  console.log(bc(MID));
  console.log(bc(valueLine('📥 Input:', formatNumber(inputTokens))));
  console.log(bc(valueLine('📤 Output:', formatNumber(outputTokens))));
  console.log(bc(valueLine('💾 Cache Read:', formatNumber(cacheRead))));
  console.log(bc(valueLine('🔨 Cache Create:', formatNumber(cacheCreate))));
  console.log(bc(DIV));
  console.log(bc(valueLine('📊 Total Tokens:', formatNumber(totalTokens))));
  console.log(bc(MID));
  console.log(bc(center(`💰 ESTIMATED COST (${modelName})`)));
  console.log(bc(MID));
  console.log(bc(valueLine('📥 Input:', formatCurrency(inputCost))));
  console.log(bc(valueLine('📤 Output:', formatCurrency(outputCost))));
  console.log(bc(valueLine('💾 Cache Read:', formatCurrency(cacheReadCost))));
  console.log(bc(valueLine('🔨 Cache Create:', formatCurrency(cacheCreateCost))));
  console.log(bc(DIV));
  console.log(bc(valueLine('💵 Total:', formatCurrency(totalCost))));
  console.log(bc(MID));
  console.log(bc(center('📈 STATS')));
  console.log(bc(MID));
  console.log(bc(valueLine('📆 Daily Avg Cost:', formatCurrency(dailyAvgCost))));
  console.log(bc(valueLine('📆 Daily Avg Tokens:', formatNumber(Math.round(dailyAvgTokens)))));
  console.log(bc(valueLine('📆 Daily Avg Messages:', formatNumber(Math.round(dailyAvgMessages)))));
  console.log(bc(valueLine('📅 Est. Monthly:', formatCurrency(estMonthly))));
  console.log(bc(valueLine('⚡ Efficiency:', `${formatNumber(efficiency)} tok/$`)));
  console.log(bc(valueLine('🎯 O/I Ratio:', `${oiRatio}:1`)));
  console.log(bc(valueLine('💾 Cache Hit Rate:', `${cacheHitRate}%`)));
  console.log(bc(valueLine('🏆 Longest Session:', `${formatNumber(longestMessages)} messages / ${longestHours} hours`)));
  console.log(bc(MID));
  console.log(bc(center('⏰ ACTIVITY BY HOUR')));
  console.log(bc(MID));

  // 시간대별 막대 그래프 출력
  const bar1 = `00-05: ${makeBar(hourGroups[0].count, maxGroupCount)}`;
  const bar2 = `06-11: ${makeBar(hourGroups[1].count, maxGroupCount)}`;
  const bar3 = `12-17: ${makeBar(hourGroups[2].count, maxGroupCount)}`;
  const bar4 = `18-23: ${makeBar(hourGroups[3].count, maxGroupCount)}`;

  // 두 줄로 나눠서 출력 (각 막대 + 간격)
  const activityLine1 = `${bar1}    ${bar2}`;
  const activityLine2 = `${bar3}    ${bar4}`;

  console.log(bc('║  ' + padRight(activityLine1, W - 4) + '  ║'));
  console.log(bc('║  ' + padRight(activityLine2, W - 4) + '  ║'));
  console.log(bc(valueLine('🕐 Peak Hour:', `${String(peakHour).padStart(2, '0')}:00 (${peakCount} sessions)`)));

  // 최근 7일 토큰 추이 그래프
  if (recentTokens.length > 0) {
    console.log(bc(MID));
    console.log(bc(center('📊 DAILY TOKENS (Last 7 days)')));
    console.log(bc(MID));

    // 막대 그래프 라인
    const bars = recentTokens.map(d => getBarChar(d.tokens, maxDailyTokens));
    const dates = recentTokens.map(d => d.date.slice(5, 10)); // MM-DD 형식

    // 그래프 출력 (막대)
    const graphLine = bars.map(b => ` ${b} `).join('');
    const dateLine = dates.map(d => d).join(' ');

    // 최대/최소 토큰
    const maxT = Math.max(...recentTokens.map(d => d.tokens));
    const minT = Math.min(...recentTokens.map(d => d.tokens));

    console.log(bc('║  ' + padRight(graphLine, W - 4) + '  ║'));
    console.log(bc('║  ' + padRight(dateLine, W - 4) + '  ║'));
    console.log(bc(DIV));
    console.log(bc(valueLine('📈 Max:', formatNumber(maxT))));
    console.log(bc(valueLine('📉 Min:', formatNumber(minT))));
  }

  // Rate Limit 정보 (ccusage) - skipRateLimit 시 캐시만 확인
  const rateInfo = skipRateLimit ? (_rateLimitCache.loaded ? _rateLimitCache.data : null) : getRateLimitInfo();
  if (rateInfo) {
    console.log(bc(MID));
    console.log(bc(center('⏳ RATE LIMIT (ccusage)')));
    console.log(bc(MID));

    if (rateInfo.ratePct !== null) {
      console.log(bc(valueLine('📊 Usage:', `${rateInfo.ratePct}%`)));
    }
    if (rateInfo.burnRateStr) {
      console.log(bc(valueLine('🔥 Burn Rate:', rateInfo.burnRateStr)));
    }
    if (rateInfo.timeLeft) {
      console.log(bc(valueLine('⏱️ Time Left:', rateInfo.timeLeft)));
    }
    if (rateInfo.resetTime) {
      console.log(bc(valueLine('🔄 Reset At:', rateInfo.resetTime)));
    }
    console.log(bc(valueLine('💵 Block Cost:', formatCurrency(rateInfo.costUSD))));
  }

  // 현재 세션 정보
  const sessionInfo = getCurrentSessionInfo();
  if (sessionInfo) {
    console.log(bc(MID));
    console.log(bc(center('🔄 CURRENT SESSION')));
    console.log(bc(MID));
    console.log(bc(valueLine('💬 Messages:', `${formatNumber(sessionInfo.messages)} (👤 ${sessionInfo.userMessages} / 🤖 ${sessionInfo.assistantMessages})`)));
    if (sessionInfo.duration) {
      console.log(bc(valueLine('⏱️ Duration:', sessionInfo.duration)));
    }
    console.log(bc(valueLine('🔑 Session ID:', sessionInfo.sessionFile + '...')));
  }

  console.log(bc(BOT));
  console.log('');
}
