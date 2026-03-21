const { detectSpendingAnomalies, detectMissingEntries } = require('./anomalyService');
const { computeForecast } = require('./cashFlowService');

/**
 * Builds a natural-language advisory statement based on forecast and anomalies.
 */
function buildAdvisory(forecast, anomalies, missingEntries) {
    const recentAnomalies = (anomalies || []).filter(a => {
        const ageMs = Date.now() - new Date(a.date).getTime();
        return ageMs < 7 * 86400000; // Flagged in last 7 days
    });

    const willDip = forecast.warnings.length > 0;
    const lowest = forecast.summaryMetrics.lowestProjectedBalance;
    
    let statement;

    if (willDip && recentAnomalies.length > 0) {
        statement = `Your balance is projected to dip to ${lowest.toFixed(0)} around ${forecast.warnings[0].date}. `
                  + `However, ${recentAnomalies.length} recent transaction(s) were flagged as one-time anomalies and have been normalized in this forecast. `
                  + `Your long-term spending trajectory remains within normal range.`;
    } else if (willDip) {
        statement = `Your balance is projected to drop below your warning threshold. Review upcoming installments and variable spending.`;
    } else if (recentAnomalies.length > 0) {
        statement = `A large one-time expense was detected recently, but your 30-day liquidity outlook remains stable.`;
    } else {
        statement = `Your financial outlook for the next 30 days looks healthy. No major risks detected.`;
    }

    if (missingEntries.length > 0) {
        statement += ` Note: ${missingEntries[0].message}`;
    }

    return statement;
}

/**
 * Calculates confidence bands (low/high bounds) for the projected balance.
 */
function computeConfidenceBands(dailyBalances, anomalyCount) {
    return dailyBalances.map((day, i) => {
        // Uncertainty grows over time (max 15% at day 30) 
        // and with the number of anomalies (3% per anomaly, max 10%)
        const timeUncertainty = (i / dailyBalances.length) * 0.15;
        const anomalyUncertainty = Math.min(anomalyCount * 0.03, 0.10);
        const totalUncertainty = timeUncertainty + anomalyUncertainty;

        return {
            ...day,
            low: day.balance * (1 - totalUncertainty),
            high: day.balance * (1 + totalUncertainty)
        };
    });
}

/**
 * Orchestrates the Intelligence Loop.
 */
const getUnifiedAdvisory = async (userId, settings = { sensitivity: 3 }) => {
    // 1. Detect anomalies first
    const { anomalies } = await detectSpendingAnomalies(userId, settings.sensitivity);
    const missingEntries = await detectMissingEntries(userId);
    const anomalyMask = new Set(anomalies.map(a => a.id));

    // 2. Compute forecast using anomaly normalization
    const forecast = await computeForecast(userId, {
        duration: 30,
        anomalyMask
    });

    // 3. Synthesize insights
    const advisoryStatement = buildAdvisory(forecast, anomalies, missingEntries);
    const dailyBalancesWithBands = computeConfidenceBands(forecast.dailyBalances, anomalies.length);

    return {
        success: true,
        advisoryStatement,
        forecast: {
            ...forecast,
            dailyBalances: dailyBalancesWithBands
        },
        anomalies,
        missingEntries,
        dataFreshness: forecast.summaryMetrics.dataFreshness
    };
};

module.exports = {
    getUnifiedAdvisory
};
