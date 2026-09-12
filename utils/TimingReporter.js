// utils/TimingReporter.js
//
// Custom Playwright reporter (registered in playwright.config.js) that tracks total
// suite execution time plus a per-test breakdown, prints a summary to the console,
// and writes reports/results/execution-time.json so it can be surfaced in CI output,
// a README badge, or pulled into the HTML report's attachments.

const fs = require('fs');
const path = require('path');

class TimingReporter {
  constructor() {
    this.suiteStart = 0;
    this.testTimings = [];
  }

  onBegin(config, suite) {
    this.suiteStart = Date.now();
    console.log(`\n[TimingReporter] Suite started — ${suite.allTests().length} test(s) queued.\n`);
  }

  onTestEnd(test, result) {
    this.testTimings.push({
      title: test.titlePath().slice(1).join(' > '),
      status: result.status,
      durationMs: result.duration,
    });
  }

  onEnd(result) {
    const totalMs = Date.now() - this.suiteStart;
    const totalSeconds = (totalMs / 1000).toFixed(2);

    const summary = {
      overallStatus: result.status,
      totalExecutionTimeMs: totalMs,
      totalExecutionTimeHuman: `${totalSeconds}s`,
      testCount: this.testTimings.length,
      tests: this.testTimings,
      generatedAt: new Date().toISOString(),
    };

    const outDir = path.join(process.cwd(), 'reports', 'results');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'execution-time.json'), JSON.stringify(summary, null, 2));

    console.log('\n========================================');
    console.log(' EXECUTION TIME SUMMARY');
    console.log('========================================');
    this.testTimings.forEach(t => {
      console.log(`  [${t.status.toUpperCase()}] ${t.title} — ${(t.durationMs / 1000).toFixed(2)}s`);
    });
    console.log('----------------------------------------');
    console.log(`  TOTAL EXECUTION TIME: ${totalSeconds}s`);
    console.log('========================================\n');
  }
}

module.exports = TimingReporter;
