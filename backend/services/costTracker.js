const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Cost tracking file
const COST_LOG_FILE = path.join(__dirname, '../logs/cost-tracking.json');

// Ensure logs directory exists
const logsDir = path.dirname(COST_LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Track API costs for transparency and monitoring
 * @param {Object} costData - Cost tracking data
 * @param {string} costData.type - Type of operation (e.g., 'transcription', 'download')
 * @param {number} costData.duration - Duration in minutes (for time-based costs)
 * @param {number} costData.cost - Cost in dollars
 * @param {string} costData.audioHash - Hash of processed audio
 * @param {string} costData.status - Status ('success' or 'failed')
 * @returns {Promise<void>}
 */
async function trackCost(costData) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      type: costData.type,
      duration: costData.duration,
      cost: costData.cost,
      audioHash: costData.audioHash,
      status: costData.status
    };

    logger.info('Tracking cost', entry);

    // Append to cost log file
    let costLog = [];
    if (fs.existsSync(COST_LOG_FILE)) {
      try {
        const data = fs.readFileSync(COST_LOG_FILE, 'utf8');
        costLog = JSON.parse(data);
      } catch (parseError) {
        logger.warn('Failed to parse cost log file, starting fresh', {
          error: parseError.message
        });
        costLog = [];
      }
    }

    costLog.push(entry);

    // Keep only last 10000 entries to prevent file from growing too large
    if (costLog.length > 10000) {
      costLog = costLog.slice(-10000);
    }

    fs.writeFileSync(COST_LOG_FILE, JSON.stringify(costLog, null, 2));

    // Check against cost limits
    await checkCostLimits(costLog);
  } catch (error) {
    logger.error('Failed to track cost', {
      error: error.message,
      costData
    });

    // Don't throw - cost tracking failures shouldn't block main operations
  }
}

/**
 * Check if costs exceed daily/monthly limits
 * @private
 */
async function checkCostLimits(costLog) {
  const dailyLimit = parseFloat(process.env.COST_DAILY_LIMIT || '50'); // $50/day default
  const monthlyLimit = parseFloat(process.env.COST_MONTHLY_LIMIT || '500'); // $500/month default

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate today's and month's costs
  let dailyCost = 0;
  let monthlyCost = 0;

  for (const entry of costLog) {
    const entryDate = new Date(entry.timestamp);
    const cost = entry.cost || 0;

    if (entryDate >= monthStart) {
      monthlyCost += cost;

      if (entryDate >= today) {
        dailyCost += cost;
      }
    }
  }

  // Log warnings if limits exceeded
  if (dailyCost > dailyLimit) {
    logger.warn('Daily cost limit exceeded', {
      dailyCost: dailyCost.toFixed(2),
      dailyLimit: dailyLimit.toFixed(2),
      exceeded: (dailyCost - dailyLimit).toFixed(2)
    });
  }

  if (monthlyCost > monthlyLimit) {
    logger.warn('Monthly cost limit exceeded', {
      monthlyCost: monthlyCost.toFixed(2),
      monthlyLimit: monthlyLimit.toFixed(2),
      exceeded: (monthlyCost - monthlyLimit).toFixed(2)
    });
  }
}

/**
 * Get cost statistics
 * @returns {Promise<{daily: number, monthly: number, total: number}>}
 */
async function getCostStats() {
  try {
    if (!fs.existsSync(COST_LOG_FILE)) {
      return {
        daily: 0,
        monthly: 0,
        total: 0,
        dateRange: {
          start: null,
          end: null
        }
      };
    }

    const data = fs.readFileSync(COST_LOG_FILE, 'utf8');
    const costLog = JSON.parse(data);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let dailyCost = 0;
    let monthlyCost = 0;
    let totalCost = 0;

    for (const entry of costLog) {
      const entryDate = new Date(entry.timestamp);
      const cost = entry.cost || 0;

      totalCost += cost;

      if (entryDate >= monthStart) {
        monthlyCost += cost;

        if (entryDate >= today) {
          dailyCost += cost;
        }
      }
    }

    return {
      daily: parseFloat(dailyCost.toFixed(4)),
      monthly: parseFloat(monthlyCost.toFixed(4)),
      total: parseFloat(totalCost.toFixed(4)),
      dateRange: {
        start: costLog.length > 0 ? costLog[0].timestamp : null,
        end: costLog.length > 0 ? costLog[costLog.length - 1].timestamp : null
      }
    };
  } catch (error) {
    logger.error('Failed to get cost stats', {
      error: error.message
    });

    return {
      daily: 0,
      monthly: 0,
      total: 0,
      error: error.message
    };
  }
}

/**
 * Get detailed cost log
 * @param {number} limit - Maximum number of entries to return
 * @returns {Promise<Array>}
 */
async function getCostLog(limit = 100) {
  try {
    if (!fs.existsSync(COST_LOG_FILE)) {
      return [];
    }

    const data = fs.readFileSync(COST_LOG_FILE, 'utf8');
    const costLog = JSON.parse(data);

    // Return most recent entries
    return costLog.slice(-limit).reverse();
  } catch (error) {
    logger.error('Failed to get cost log', {
      error: error.message
    });

    return [];
  }
}

/**
 * Clear cost logs (for testing or manual reset)
 * @returns {Promise<void>}
 */
async function clearCostLogs() {
  try {
    if (fs.existsSync(COST_LOG_FILE)) {
      fs.unlinkSync(COST_LOG_FILE);
      logger.info('Cost logs cleared');
    }
  } catch (error) {
    logger.error('Failed to clear cost logs', {
      error: error.message
    });

    throw error;
  }
}

module.exports = {
  trackCost,
  getCostStats,
  getCostLog,
  clearCostLogs
};
