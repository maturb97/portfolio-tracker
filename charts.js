// Elite Portfolio Analytics - Advanced Charts Engine
// Professional financial charts with interactive features

class PortfolioCharts {
    constructor() {
        this.charts = new Map();
        this.chartConfigs = new Map();
        this.defaultOptions = this.getDefaultChartOptions();
    }

    // ===== CHART INITIALIZATION =====

    initializeAllCharts() {
        this.createPortfolioValueChart();
        this.createPLChart();
        this.createDividendsChart();
        this.createBenchmarkChart();
        this.createAllocationCharts();
    }

    getDefaultChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: 'Inter, sans-serif',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: CONFIG.COLORS.PRIMARY,
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            
                            if (label.includes('%')) {
                                return `${label}: ${value.toFixed(2)}%`;
                            } else if (label.includes('zł') || label.includes('$')) {
                                return `${label}: ${Utils.formatCurrency(value)}`;
                            } else {
                                return `${label}: ${Utils.formatNumber(value)}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            day: 'MMM dd',
                            week: 'MMM dd',
                            month: 'MMM yyyy',
                            quarter: 'MMM yyyy',
                            year: 'yyyy'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'Inter, sans-serif',
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'Inter, sans-serif',
                            size: 11
                        },
                        callback: function(value) {
                            return Utils.formatCurrency(value);
                        }
                    }
                }
            }
        };
    }

    // ===== MAIN PORTFOLIO CHARTS =====

    createPortfolioValueChart() {
        const ctx = document.getElementById('portfolio-value-chart');
        if (!ctx) return;

        const config = {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Market Value',
                        data: [],
                        borderColor: CONFIG.COLORS.PRIMARY,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'Cost Basis',
                        data: [],
                        borderColor: CONFIG.COLORS.SECONDARY,
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    title: {
                        display: false
                    }
                }
            }
        };

        this.charts.set('portfolio-value', new Chart(ctx, config));
        this.chartConfigs.set('portfolio-value', config);
    }

    createPLChart() {
        const ctx = document.getElementById('pl-chart');
        if (!ctx) return;

        const config = {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Unrealized P&L',
                        data: [],
                        borderColor: CONFIG.COLORS.SUCCESS,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: 'Realized P&L',
                        data: [],
                        borderColor: CONFIG.COLORS.INFO,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Total P&L',
                        data: [],
                        borderColor: CONFIG.COLORS.WARNING,
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        ticks: {
                            ...this.defaultOptions.scales.y.ticks,
                            callback: function(value) {
                                const color = value >= 0 ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.DANGER;
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        };

        this.charts.set('pl-chart', new Chart(ctx, config));
        this.chartConfigs.set('pl-chart', config);
    }

    createDividendsChart() {
        const ctx = document.getElementById('dividends-chart');
        if (!ctx) return;

        const config = {
            type: 'bar',
            data: {
                datasets: [
                    {
                        label: 'Monthly Dividends',
                        data: [],
                        backgroundColor: CONFIG.COLORS.SUCCESS,
                        borderColor: CONFIG.COLORS.SUCCESS,
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Cumulative Dividends',
                        data: [],
                        type: 'line',
                        borderColor: CONFIG.COLORS.INFO,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        };

        this.charts.set('dividends-chart', new Chart(ctx, config));
        this.chartConfigs.set('dividends-chart', config);
    }

    createBenchmarkChart() {
        const ctx = document.getElementById('benchmark-chart');
        if (!ctx) return;

        const config = {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Portfolio',
                        data: [],
                        borderColor: CONFIG.COLORS.PRIMARY,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'S&P 500',
                        data: [],
                        borderColor: CONFIG.COLORS.SUCCESS,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'WIG20',
                        data: [],
                        borderColor: CONFIG.COLORS.DANGER,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Bitcoin',
                        data: [],
                        borderColor: CONFIG.COLORS.WARNING,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        ticks: {
                            ...this.defaultOptions.scales.y.ticks,
                            callback: function(value) {
                                return `${value.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        };

        this.charts.set('benchmark-chart', new Chart(ctx, config));
        this.chartConfigs.set('benchmark-chart', config);
    }

    createAllocationCharts() {
        this.createMarketAllocationChart();
        this.createSectorAllocationChart();
        this.createCurrencyChart();
    }

    createMarketAllocationChart() {
        const ctx = document.getElementById('market-allocation-chart');
        if (!ctx) return;

        const config = {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        CONFIG.COLORS.PRIMARY,
                        CONFIG.COLORS.SUCCESS,
                        CONFIG.COLORS.WARNING,
                        CONFIG.COLORS.INFO
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.charts.set('market-allocation', new Chart(ctx, config));
        this.chartConfigs.set('market-allocation', config);
    }

    createSectorAllocationChart() {
        const ctx = document.getElementById('sector-allocation-chart');
        if (!ctx) return;

        const config = {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: CONFIG.COLORS.CHART_COLORS,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.charts.set('sector-allocation', new Chart(ctx, config));
        this.chartConfigs.set('sector-allocation', config);
    }

    createCurrencyChart() {
        const ctx = document.getElementById('currency-chart');
        if (!ctx) return;

        const config = {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        CONFIG.COLORS.PRIMARY,
                        CONFIG.COLORS.SUCCESS,
                        CONFIG.COLORS.WARNING
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        this.charts.set('currency-chart', new Chart(ctx, config));
        this.chartConfigs.set('currency-chart', config);
    }

    // ===== CHART UPDATE METHODS =====

    updatePortfolioValueChart(dailyData) {
        const chart = this.charts.get('portfolio-value');
        if (!chart || !dailyData) return;

        const selector = document.getElementById('chart1-metric')?.value || 'both';
        
        // Prepare data based on selector
        const marketValueData = dailyData.map(d => ({
            x: d.date,
            y: d.marketValue
        }));

        const costBasisData = dailyData.map(d => ({
            x: d.date,
            y: d.costBasis
        }));

        // Update datasets based on selection
        chart.data.datasets[0].data = marketValueData;
        chart.data.datasets[0].hidden = selector === 'cost';
        
        chart.data.datasets[1].data = costBasisData;
        chart.data.datasets[1].hidden = selector === 'value';

        chart.update('none');
    }

    updatePLChart(dailyData) {
        const chart = this.charts.get('pl-chart');
        if (!chart || !dailyData) return;

        const selector = document.getElementById('chart2-metric')?.value || 'unrealized';

        const unrealizedData = dailyData.map(d => ({
            x: d.date,
            y: d.unrealizedPL
        }));

        const realizedData = dailyData.map(d => ({
            x: d.date,
            y: d.realizedPL
        }));

        const totalData = dailyData.map(d => ({
            x: d.date,
            y: d.unrealizedPL + d.realizedPL
        }));

        // Update visibility based on selection
        chart.data.datasets[0].data = unrealizedData;
        chart.data.datasets[0].hidden = selector === 'realized' || selector === 'total';
        
        chart.data.datasets[1].data = realizedData;
        chart.data.datasets[1].hidden = selector === 'unrealized' || selector === 'total';
        
        chart.data.datasets[2].data = totalData;
        chart.data.datasets[2].hidden = selector !== 'total';

        chart.update('none');
    }

    updateDividendsChart(monthlyDividends) {
        const chart = this.charts.get('dividends-chart');
        if (!chart || !monthlyDividends) return;

        const monthlyData = monthlyDividends.map(d => ({
            x: d.month,
            y: d.amount
        }));

        let cumulative = 0;
        const cumulativeData = monthlyDividends.map(d => {
            cumulative += d.amount;
            return {
                x: d.month,
                y: cumulative
            };
        });

        chart.data.datasets[0].data = monthlyData;
        chart.data.datasets[1].data = cumulativeData;

        chart.update('none');
    }

    updateBenchmarkChart(performanceData) {
        const chart = this.charts.get('benchmark-chart');
        if (!chart || !performanceData) return;

        const selector = document.getElementById('benchmark-selector')?.value || 'SPY';

        // Normalize all performance to percentage returns from start
        const portfolioData = performanceData.portfolio?.map(d => ({
            x: d.date,
            y: d.return * 100
        })) || [];

        const benchmarkData = performanceData[selector]?.map(d => ({
            x: d.date,
            y: d.return * 100
        })) || [];

        chart.data.datasets[0].data = portfolioData;
        
        // Hide all benchmark datasets first
        chart.data.datasets.forEach((dataset, index) => {
            if (index > 0) dataset.hidden = true;
        });

        // Show selected benchmark
        switch(selector) {
            case 'SPY':
                chart.data.datasets[1].data = benchmarkData;
                chart.data.datasets[1].hidden = false;
                break;
            case 'WIG20':
                chart.data.datasets[2].data = benchmarkData;
                chart.data.datasets[2].hidden = false;
                break;
            case 'BTC':
                chart.data.datasets[3].data = benchmarkData;
                chart.data.datasets[3].hidden = false;
                break;
        }

        chart.update('none');
    }

    updateAllocationCharts(allocationData) {
        this.updateMarketAllocation(allocationData.markets);
        this.updateSectorAllocation(allocationData.sectors);
        this.updateCurrencyAllocation(allocationData.currencies);
    }

    updateMarketAllocation(marketData) {
        const chart = this.charts.get('market-allocation');
        if (!chart || !marketData) return;

        const markets = Array.from(marketData.entries());
        
        chart.data.labels = markets.map(([market]) => market);
        chart.data.datasets[0].data = markets.map(([, value]) => value);

        chart.update('none');
    }

    updateSectorAllocation(sectorData) {
        const chart = this.charts.get('sector-allocation');
        if (!chart || !sectorData) return;

        const sectors = Array.from(sectorData.entries())
            .sort(([,a], [,b]) => b - a) // Sort by value descending
            .slice(0, 8); // Top 8 sectors

        chart.data.labels = sectors.map(([sector]) => sector);
        chart.data.datasets[0].data = sectors.map(([, value]) => value);

        chart.update('none');
    }

    updateCurrencyAllocation(currencyData) {
        const chart = this.charts.get('currency-chart');
        if (!chart || !currencyData) return;

        const currencies = Array.from(currencyData.entries());
        
        chart.data.labels = currencies.map(([currency]) => currency);
        chart.data.datasets[0].data = currencies.map(([, value]) => value);

        chart.update('none');
    }

    // ===== CHART UTILITIES =====

    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
            this.chartConfigs.delete(chartId);
        }
    }

    destroyAllCharts() {
        this.charts.forEach((chart, id) => {
            chart.destroy();
        });
        this.charts.clear();
        this.chartConfigs.clear();
    }

    resizeCharts() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    }

    // ===== EVENT HANDLERS =====

    setupChartEventHandlers() {
        // Chart metric selectors
        document.getElementById('chart1-metric')?.addEventListener('change', () => {
            window.portfolioApp?.updateCharts();
        });

        document.getElementById('chart2-metric')?.addEventListener('change', () => {
            window.portfolioApp?.updateCharts();
        });

        document.getElementById('benchmark-selector')?.addEventListener('change', () => {
            window.portfolioApp?.updateCharts();
        });

        // Window resize handler
        window.addEventListener('resize', Utils.debounce(() => {
            this.resizeCharts();
        }, 250));
    }

    // ===== EXPORT FUNCTIONALITY =====

    exportChartAsPNG(chartId, filename) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        const canvas = chart.canvas;
        const url = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = filename || `${chartId}.png`;
        link.href = url;
        link.click();
    }

    exportAllChartsAsPDF() {
        // This would require a PDF library like jsPDF
        // Implementation would export all charts to a comprehensive PDF report
        console.log('PDF export functionality to be implemented');
    }
}

// Export the charts class
window.PortfolioCharts = PortfolioCharts;