import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, LineController, BarController, Filler } from 'chart.js';
import { ChartComponent } from './ChartComponent.js';
import * as utils from './utils';
import * as constants from './constants';

// Register Chart.js components and controllers
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, LineController, BarController, Filler);

const activeComponents = new Map();

function getChartPalette() {
    return [
        utils.getCssVariableValue('--chart-color-1'),
        utils.getCssVariableValue('--chart-color-2'),
        utils.getCssVariableValue('--chart-color-3'),
        utils.getCssVariableValue('--chart-color-4'),
        utils.getCssVariableValue('--chart-color-5'),
        utils.getCssVariableValue('--chart-color-6'),
        utils.getCssVariableValue('--chart-color-7'),
        utils.getCssVariableValue('--chart-color-8'),
        utils.getCssVariableValue('--chart-color-9'),
        utils.getCssVariableValue('--chart-color-10')
    ];
}

function getBaseChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: utils.getCssVariableValue('--chart-tooltip-bg'),
                titleColor: utils.getCssVariableValue('--chart-tooltip-text'),
                bodyColor: utils.getCssVariableValue('--chart-tooltip-text'),
                borderColor: utils.getCssVariableValue('--chart-border'),
                borderWidth: 1,
                cornerRadius: 6,
                displayColors: false,
                callbacks: {
                    title: (context) => context[0].label,
                    label: (context) => utils.formatCurrency(context.parsed.y, constants.CURRENCY.DEFAULT, true)
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { 
                    color: utils.getCssVariableValue('--chart-text'),
                    font: { size: 11 }
                },
                border: { color: utils.getCssVariableValue('--chart-border') }
            },
            y: {
                grid: { 
                    color: utils.getCssVariableValue('--chart-grid'), 
                    borderDash: [5, 5] 
                },
                ticks: {
                    color: utils.getCssVariableValue('--chart-text'),
                    font: { size: 11 },
                    callback: (value) => utils.formatCurrency(value, constants.CURRENCY.DEFAULT, true)
                },
                border: { color: utils.getCssVariableValue('--chart-border') }
            }
        },
        interaction: { intersect: false, mode: 'index' }
    };
}

function prepareCanvas(canvasOrId) {
    const canvasId = typeof canvasOrId === 'string' ? canvasOrId : canvasOrId.id;

    if (activeComponents.has(canvasId)) {
        activeComponents.get(canvasId).destroy();
        activeComponents.delete(canvasId);
    }
    
    const canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
    if (canvas) {
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
    }
    return canvas;
}

export function createSpendingBarChart(canvasId, chartData) {
    const canvas = prepareCanvas(canvasId);
    if (!canvas) return;
    
    const actualId = canvas.id;
    if (!chartData || !chartData.categoryData || chartData.categoryData.length === 0) return;

    const chartConfigFactory = (currentBreakpoint) => {
        const isMobileBreakpoint = currentBreakpoint === 'default' || currentBreakpoint === 'sm';
        const labels = chartData.categoryData.map(d => utils.formatCategoryName(d.categoryName));
        const data = chartData.categoryData.map(d => d.totalAmount);
        
        const options = {
            ...getBaseChartOptions(),
            scales: {
                x: {
                    ...getBaseChartOptions().scales.x,
                    ticks: {
                        ...getBaseChartOptions().scales.x.ticks,
                        maxRotation: isMobileBreakpoint ? 90 : 45,
                        autoSkip: isMobileBreakpoint,
                        maxTicksLimit: isMobileBreakpoint ? 5 : 10
                    }
                },
                y: {
                    ...getBaseChartOptions().scales.y,
                    beginAtZero: true
                }
            }
        };

        return {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Category Spending',
                    data,
                    backgroundColor: getChartPalette(),
                    borderWidth: 0,
                    borderRadius: 4,
                }]
            },
            options
        };
    };

    const component = new ChartComponent(canvas, chartConfigFactory);
    component.init();
    activeComponents.set(actualId, component);
    return component;
}

export function createSpendingLineChart(canvasId, chartData) {
    const canvas = prepareCanvas(canvasId);
    if (!canvas) return;

    const actualId = canvas.id;
    if (!chartData || !chartData.monthlyData) return;

    const chartConfigFactory = (currentBreakpoint) => {
        const isMobileBreakpoint = currentBreakpoint === 'default' || currentBreakpoint === 'sm';
        const gridColor = utils.getCssVariableValue('--chart-grid');
        const textColor = utils.getCssVariableValue('--chart-text');

        const labels = chartData.monthlyData.map(d => d.month.substring(0, 3));
        const data = chartData.monthlyData.map(d => d.totalAmount);

        const options = {
            ...getBaseChartOptions(),
            scales: {
                x: {
                    ...getBaseChartOptions().scales.x,
                    grid: { display: false },
                    ticks: { color: textColor, maxTicksLimit: isMobileBreakpoint ? 4 : 7 }
                },
                y: {
                    ...getBaseChartOptions().scales.y,
                    beginAtZero: true,
                    grid: { display: !isMobileBreakpoint, color: gridColor },
                    ticks: { display: !isMobileBreakpoint, color: textColor }
                }
            }
        };

        const datasets = [{
            label: 'Monthly Spending',
            data,
            borderColor: utils.getCssVariableValue('--color-primary'),
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
        }];

        return { type: 'line', data: { labels, datasets }, options };
    };

    const component = new ChartComponent(canvas, chartConfigFactory);
    component.init();
    activeComponents.set(actualId, component);
    return component;
}

export function createCashFlowForecastChart(canvasId, chartData, warningThreshold) {
    const canvas = prepareCanvas(canvasId);
    if (!canvas) return;

    const actualId = canvas.id;
    if (!chartData || !chartData.dailyBalances || chartData.dailyBalances.length === 0) return;

    const chartConfigFactory = (currentBreakpoint) => {
        const isMobileBreakpoint = currentBreakpoint === 'default' || currentBreakpoint === 'sm';
        const gridColor = utils.getCssVariableValue('--chart-grid');
        const textColor = utils.getCssVariableValue('--chart-text');

        const labels = chartData.dailyBalances.map(d => utils.formatDateDisplay(d.date, { month: 'short', day: 'numeric' }));
        const balances = chartData.dailyBalances.map(d => d.balance);

        const options = {
            ...getBaseChartOptions(),
            scales: {
                x: {
                    ...getBaseChartOptions().scales.x,
                    grid: { display: false },
                    ticks: { color: textColor, maxTicksLimit: isMobileBreakpoint ? 4 : 10 }
                },
                y: {
                    ...getBaseChartOptions().scales.y,
                    beginAtZero: false,
                    grid: { display: !isMobileBreakpoint, color: gridColor },
                    ticks: { display: !isMobileBreakpoint, color: textColor }
                }
            }
        };

        const datasets = [{
            label: 'Projected Balance',
            data: balances,
            borderColor: utils.getCssVariableValue('--color-primary'),
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            segment: {
                borderColor: ctx => (ctx.p0.parsed.y < (warningThreshold || 0) || ctx.p1.parsed.y < (warningThreshold || 0)) ? utils.getCssVariableValue('--color-danger') : undefined
            }
        }];

        const plugins = [];
        if (warningThreshold !== undefined && warningThreshold !== null) {
            plugins.push({
                id: 'warningThresholdLine',
                beforeDatasetsDraw(chart) {
                    const { ctx, chartArea: { left, right }, scales: { y } } = chart;
                    ctx.save();
                    const thresholdY = y.getPixelForValue(warningThreshold);
                    ctx.beginPath();
                    ctx.strokeStyle = utils.getCssVariableValue('--color-warning');
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 2;
                    ctx.moveTo(left, thresholdY);
                    ctx.lineTo(right, thresholdY);
                    ctx.stroke();
                    ctx.restore();
                }
            });
        }

        return { type: 'line', data: { labels, datasets }, options, plugins };
    };

    const component = new ChartComponent(canvas, chartConfigFactory);
    component.init();
    activeComponents.set(actualId, component);
    return component;
}

export function destroyChart(canvasId) {
    if (activeComponents.has(canvasId)) {
        activeComponents.get(canvasId).destroy();
        activeComponents.delete(canvasId);
    }
}
