import { Chart } from 'chart.js';

/**
 * ChartComponent.js
 * Manages a Chart.js instance, providing responsive re-rendering based on its container's size
 * using ResizeObserver.
 * It dynamically adjusts Chart.js configurations (e.g., chart type, tick limits, grid visibility)
 * based on defined breakpoints, ensuring optimal display on various screen sizes without full page reloads.
 */

export class ChartComponent {
    /**
     * @param {string} canvasId - The ID of the canvas element for the chart.
     * @param {Function} chartConfigFactory - A function that takes (currentBreakpoint, containerWidth)
     *   and returns a complete Chart.js configuration object (including type, data, and options).
     *   This allows for dynamic data transformation and option overrides based on the current size.
     */
    constructor(canvasOrId, chartConfigFactory) {
        this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
        this.canvasId = typeof canvasOrId === 'string' ? canvasOrId : (this.canvas?.id || 'unnamed-chart');
        
        if (!this.canvas) {
            console.error(`ChartComponent: Canvas ${typeof canvasOrId === 'string' ? "with ID '" + canvasOrId + "'" : "element"} not found.`);
            return;
        }
        this.parent = this.canvas.parentElement;
        this.chartConfigFactory = chartConfigFactory;

        this.chartInstance = null;
        this.resizeObserver = null;
        this.currentBreakpoint = null; // Stores the active breakpoint (e.g., 'sm', 'md', 'lg')

        // Define breakpoints, matching Tailwind's defaults
        // These are min-widths for responsive logic (e.g., sm means >=640px).
        this.breakpoints = {
            'default': 0,    // Base/mobile style (always active)
            'sm': 640,
            'md': 768,
            'lg': 1024,
            'xl': 1280,
            '2xl': 1536
        };

        // Bind event handlers to the instance
        this._handleResize = this._handleResize.bind(this);
    }

    /**
     * Initializes the chart and sets up the ResizeObserver.
     */
    init() {
        if (!this.canvas || !this.parent) return;

        this._setupResizeObserver();
        // Initial render based on current size
        this._checkBreakpointAndRender();
    }

    /**
     * Sets up the ResizeObserver on the chart's parent element.
     */
    _setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(this._handleResize);
        // Observe the parent element to react to its size changes
        this.resizeObserver.observe(this.parent);
    }

    /**
     * Handles resize events from ResizeObserver.
     * @param {ResizeObserverEntry[]} entries
     */
    _handleResize(entries) {
        for (let entry of entries) {
            if (entry.target === this.parent) {
                this._checkBreakpointAndRender();
            }
        }
    }

    /**
     * Determines the current responsive breakpoint and re-renders the chart if necessary.
     */
    _checkBreakpointAndRender() {
        if (!this.parent) return;

        const containerWidth = this.parent.clientWidth;
        let newBreakpoint = 'default';

        // Determine the current active breakpoint
        const sortedBreakpoints = Object.keys(this.breakpoints).sort((a, b) => this.breakpoints[a] - this.breakpoints[b]);
        for (const bp of sortedBreakpoints) {
            if (containerWidth >= this.breakpoints[bp]) {
                newBreakpoint = bp;
            }
        }

        // Only re-render the full chart if the breakpoint has changed
        // Chart.js's native `responsive: true` handles canvas resizing within the same breakpoint.
        if (newBreakpoint !== this.currentBreakpoint) {
            this.currentBreakpoint = newBreakpoint;
            this._renderChart();
        } else if (!this.chartInstance) {
             // Initial render if chart hasn't been created yet
            this._renderChart();
        }
    }

    /**
     * Renders or re-renders the Chart.js instance based on the current breakpoint.
     */
    _renderChart() {
        if (!this.canvas) return;

        // Get the full Chart.js config from the factory function
        const configToApply = this.chartConfigFactory(this.currentBreakpoint, this.parent.clientWidth);

        // Optimization: If chart instance exists and type is the same, just update data and options
        if (this.chartInstance && this.chartInstance.config.type === configToApply.type) {
            this.chartInstance.data = configToApply.data;
            this.chartInstance.options = configToApply.options;
            this.chartInstance.update('none'); // Update without animation for faster feedback during resize/data switch
            return;
        }

        // Destroy existing chart if it exists but type is different
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Create new chart instance
        this.chartInstance = new Chart(this.canvas, configToApply);
    }

    /**
     * Public method to update chart data *without* changing the structure/type.
     * Useful for updating data for the currently active chart configuration.
     * If the structure needs to change, it's better to trigger a re-render
     * by changing the breakpoint or calling _renderChart directly if data affects config.
     * @param {object} newData - The new data object to set for the chart. (e.g., { labels: [], datasets: [] })
     */
    updateData(newData) {
        if (this.chartInstance && newData) {
            this.chartInstance.data = newData;
            this.chartInstance.update();
        } else {
            console.warn("ChartComponent: Attempted to update data on an uninitialized chart or with invalid data.");
        }
    }
    
    /**
     * Public method to trigger a re-render with potentially new data/options
     * if the factory function has internal state or external dependencies that changed.
     */
    reRender() {
        this._renderChart();
    }


    /**
     * Updates the configuration factory and triggers a re-render.
     * This allows reusing the component and its observers while changing the chart data/logic.
     * @param {Function} newFactory 
     */
    updateConfigFactory(newFactory) {
        this.chartConfigFactory = newFactory;
        this.reRender();
    }

    /**
     * Cleans up the chart and observer.
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }
}
