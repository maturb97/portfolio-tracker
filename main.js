// Elite Portfolio Analytics Platform - Main Application
// Professional portfolio tracker with advanced analytics and risk management

class PortfolioTracker {
    constructor() {
        this.analytics = new PortfolioAnalytics();
        this.charts = new PortfolioCharts();
        this.currentCurrency = 'PLN';
        this.currentPeriod = '1Y';
        this.isLoading = false;
        this.lastUpdate = null;
        this.priceCache = new Map();
        this.exchangeRates = new Map();
        
        // Auto-update intervals
        this.updateIntervals = {
            prices: null,
            rates: null
        };

        this.init();
    }

    // ===== INITIALIZATION =====

    async init() {
        console.log('🚀 Initializing Elite Portfolio Analytics Platform...');
        
        try {
            this.showLoadingOverlay(true);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize charts
            this.charts.initializeAllCharts();
            this.charts.setupChartEventHandlers();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup auto-update intervals
            this.setupAutoUpdate();
            
            // Update display
            await this.updateAllDisplays();
            
            console.log('✅ Portfolio Analytics Platform initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize platform:', error);
            this.showError('Failed to initialize portfolio tracker. Please refresh the page.');
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    setupEventListeners() {
        // Currency selector
        document.getElementById('currency-selector')?.addEventListener('change', (e) => {
            this.currentCurrency = e.target.value;
            this.updateAllDisplays();
        });

        // Time period selector
        document.getElementById('time-period')?.addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.updateAllDisplays();
        });

        // Refresh button
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.refreshData();
        });

        // Holdings table filters
        document.getElementById('search-holdings')?.addEventListener('input', 
            Utils.debounce((e) => this.filterHoldings(e.target.value), 300)
        );

        document.getElementById('holdings-filter')?.addEventListener('change', (e) => {
            this.filterHoldingsByMarket(e.target.value);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportData();
                        break;
                }
            }
        });
    }

    setupAutoUpdate() {
        // Update prices every hour
        this.updateIntervals.prices = setInterval(() => {
            this.updatePrices();
        }, CONFIG.UPDATE_INTERVALS.PRICES);

        // Update exchange rates daily
        this.updateIntervals.rates = setInterval(() => {
            this.updateExchangeRates();
        }, CONFIG.UPDATE_INTERVALS.EXCHANGE_RATES);
    }

    // ===== DATA LOADING =====

    async loadInitialData() {
        console.log('📊 Loading initial portfolio data...');
        
        try {
            // Load transactions from Google Sheets
            const transactions = await this.fetchTransactionsFromSheets();
            console.log(`📈 Loaded ${transactions.length} transactions`);
            
            // Process transactions through analytics engine
            this.analytics.processTransactions(transactions);
            
            // Load current prices
            await this.updatePrices();
            
            // Load exchange rates
            await this.updateExchangeRates();
            
            // Load benchmark data
            await this.loadBenchmarkData();
            
            console.log('✅ Initial data loading completed');
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            throw error;
        }
    }

    async fetchTransactionsFromSheets() {
        const url = `${CONFIG.GOOGLE_SHEETS.BASE_URL}/${CONFIG.GOOGLE_SHEETS.SHEET_ID}/values/${CONFIG.GOOGLE_SHEETS.RANGE}?key=${CONFIG.GOOGLE_SHEETS.API_KEY}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Google Sheets API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.values || data.values.length < 2) {
                console.warn('No transaction data found, using sample data');
                return this.getSampleTransactions();
            }
            
            // Parse transactions (skip header row)
            const transactions = data.values.slice(1).map((row, index) => {
                // Handle missing symbol - derive from context or use row number
                let symbol = row[3] || `Asset_${index + 1}`;
                
                // For your sheet structure, symbol might be in different position
                // Let's try to find it intelligently
                if (!symbol || symbol === '') {
                    // Look for non-empty string that could be a symbol
                    for (let i = 2; i < 6; i++) {
                        if (row[i] && typeof row[i] === 'string' && row[i].length > 0) {
                            symbol = row[i];
                            break;
                        }
                    }
                }
                
                return {
                    date: row[0],           // Date
                    type: row[1],           // Type
                    market: row[2],         // Market
                    symbol: symbol,         // Symbol
                    units: row[4],          // Units
                    txPrice: row[5],        // TX Price
                    fees: row[6] || 0,      // Fees
                    split: row[7] || 1.0,   // Split
                    currency: row[8] || 'USD' // Currency
                };
            }).filter(tx => tx.date && tx.type && tx.symbol); // Filter out empty rows
            
            console.log('Parsed transactions:', transactions);
            return transactions;
            
        } catch (error) {
            console.error('Error fetching transactions from Google Sheets:', error);
            console.log('Using sample data instead');
            return this.getSampleTransactions();
        }
    }

    getSampleTransactions() {
        return [
            {
                date: '2024-01-15',
                type: 'Buy',
                market: 'US',
                symbol: 'AAPL',
                units: '10',
                txPrice: '175.50',
                fees: '1.00',
                split: '1.0',
                currency: 'USD'
            },
            {
                date: '2024-02-01',
                type: 'Buy',
                market: 'CRYPTO',
                symbol: 'Bitcoin',
                units: '0.1',
                txPrice: '42000.00',
                fees: '10.00',
                split: '1.0',
                currency: 'USD'
            },
            {
                date: '2024-03-01',
                type: 'Div',
                market: 'US',
                symbol: 'AAPL',
                units: '10',
                txPrice: '0.25',
                fees: '0.00',
                split: '1.0',
                currency: 'USD'
            }
        ];
    }

    async updatePrices() {
        console.log('💰 Updating current prices...');
        
        try {
            const symbols = Array.from(this.analytics.holdings.keys());
            const pricePromises = symbols.map(symbol => this.fetchPrice(symbol));
            const prices = await Promise.all(pricePromises);
            
            // Update price cache
            symbols.forEach((symbol, index) => {
                if (prices[index] !== null) {
                    this.priceCache.set(symbol, {
                        price: prices[index],
                        timestamp: Date.now()
                    });
                }
            });
            
            // Update analytics with new prices
            this.analytics.updatePrices(this.priceCache);
            
            console.log(`✅ Updated prices for ${symbols.length} instruments`);
            
        } catch (error) {
            console.error('❌ Error updating prices:', error);
        }
    }

    async fetchPrice(symbol) {
        try {
            const holding = this.analytics.holdings.get(symbol);
            if (!holding) return null;

            let price = null;

            switch (holding.market) {
                case CONFIG.MARKETS.CRYPTO:
                    price = await this.fetchCryptoPrice(symbol);
                    break;
                    
                case CONFIG.MARKETS.US:
                case CONFIG.MARKETS.PL:
                    price = await this.fetchStockPrice(symbol);
                    break;
                    
                case CONFIG.MARKETS.PHYSICAL:
                    price = await this.fetchCommodityPrice(symbol);
                    break;
                    
                default:
                    console.warn(`Unknown market type for ${symbol}: ${holding.market}`);
                    return null;
            }

            return price;
            
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            return null;
        }
    }

    async fetchStockPrice(symbol) {
        try {
            // Try Yahoo Finance API
            const url = `${CONFIG.PRICE_APIS.YAHOO.BASE_URL}${CONFIG.PRICE_APIS.YAHOO.CHART_URL}/${symbol}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                if (price) return price;
            }
            
            // Fallback to hardcoded prices for development
            const fallbackPrices = {
                'AAPL': 175.43,
                'MSFT': 378.85,
                'GOOGL': 143.42,
                'TSLA': 248.50,
                'AMZN': 155.89,
                'META': 331.05,
                'NVDA': 875.28,
                'MO': 59.65,
                'BKH': 60.50,
                'ENB': 45.20,
                'NEM': 45.80,
                'GOLD': 28.90,
                'VALE': 12.45,
                'CTRA': 28.75,
                'MMM': 128.90,
                'VICI': 32.15,
                'PEP': 162.50,
                'CDR': 85.30,  // PLN
                'ACP': 142.50  // PLN
            };
            
            return fallbackPrices[symbol] || 100; // Default fallback
            
        } catch (error) {
            console.error(`Error fetching stock price for ${symbol}:`, error);
            return null;
        }
    }

    async fetchCryptoPrice(symbol) {
        try {
            const cryptoIds = {
                'Bitcoin': 'bitcoin',
                'BTC': 'bitcoin',
                'Ethereum': 'ethereum',
                'ETH': 'ethereum'
            };
            
            const coinId = cryptoIds[symbol];
            if (!coinId) return null;
            
            const url = `${CONFIG.PRICE_APIS.COINGECKO.BASE_URL}${CONFIG.PRICE_APIS.COINGECKO.SIMPLE_PRICE}?ids=${coinId}&vs_currencies=usd`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                return data[coinId]?.usd || null;
            }
            
            return null;
            
        } catch (error) {
            console.error(`Error fetching crypto price for ${symbol}:`, error);
            return null;
        }
    }

    async fetchCommodityPrice(symbol) {
        try {
            if (symbol.toLowerCase().includes('silver')) {
                const url = `${CONFIG.PRICE_APIS.COINGECKO.BASE_URL}${CONFIG.PRICE_APIS.COINGECKO.SIMPLE_PRICE}?ids=silver&vs_currencies=usd`;
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    return data.silver?.usd || null;
                }
            }
            
            return null;
            
        } catch (error) {
            console.error(`Error fetching commodity price for ${symbol}:`, error);
            return null;
        }
    }

    async updateExchangeRates() {
        console.log('💱 Updating exchange rates...');
        
        try {
            // Fetch USD/PLN rate from NBP
            const url = `${CONFIG.PRICE_APIS.NBP.BASE_URL}${CONFIG.PRICE_APIS.NBP.RATES}/usd/?format=json`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const rate = data.rates[0].mid;
                
                this.exchangeRates.set('USD/PLN', {
                    rate: rate,
                    timestamp: Date.now(),
                    date: data.rates[0].effectiveDate
                });
                
                console.log(`✅ Updated USD/PLN rate: ${rate}`);
            }
            
        } catch (error) {
            console.error('❌ Error updating exchange rates:', error);
            // Fallback rate
            this.exchangeRates.set('USD/PLN', {
                rate: 4.0,
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0]
            });
        }
    }

    async loadBenchmarkData() {
        console.log('📈 Loading benchmark data...');
        
        // This would fetch historical data for benchmarks
        // For now, we'll skip this in the MVP
        console.log('⏳ Benchmark data loading postponed for MVP');
    }

    // ===== DISPLAY UPDATES =====

    async updateAllDisplays() {
        console.log('🔄 Updating all displays...');
        
        try {
            // Calculate current metrics
            const metrics = this.analytics.calculatePortfolioMetrics(this.currentPeriod);
            
            // Update main overview cards
            this.updateOverviewCards(metrics);
            
            // Update advanced analytics
            this.updateAdvancedAnalytics(metrics);
            
            // Update holdings table
            this.updateHoldingsTable();
            
            // Update charts
            this.updateCharts();
            
            // Update tax summary
            this.updateTaxSummary();
            
            // Update last update timestamp
            this.updateLastUpdateTime();
            
            console.log('✅ All displays updated successfully');
            
        } catch (error) {
            console.error('❌ Error updating displays:', error);
        }
    }

    updateOverviewCards(metrics) {
        const rate = this.getExchangeRate();
        const symbol = this.currentCurrency === 'PLN' ? 'zł' : '$';
        
        // Total Portfolio Value
        const totalValue = metrics.totalValue * rate;
        document.getElementById('total-value').textContent = Utils.formatCurrency(totalValue, this.currentCurrency);
        
        // Value change calculation (simplified)
        const valueChange = metrics.unrealizedPL * rate;
        const valueChangePercent = metrics.totalReturn;
        const changeElement = document.getElementById('total-value-change');
        
        changeElement.textContent = `${valueChange >= 0 ? '+' : ''}${Utils.formatCurrency(valueChange, this.currentCurrency)} (${valueChangePercent.toFixed(2)}%)`;
        changeElement.className = valueChange >= 0 ? 'text-sm text-positive mt-1' : 'text-sm text-negative mt-1';
        
        // Unrealized P&L
        const unrealizedPL = metrics.unrealizedPL * rate;
        const unrealizedElement = document.getElementById('unrealized-pl');
        const unrealizedPercentElement = document.getElementById('unrealized-pl-percent');
        
        unrealizedElement.textContent = Utils.formatCurrency(unrealizedPL, this.currentCurrency);
        unrealizedElement.className = unrealizedPL >= 0 ? 'text-3xl font-bold text-positive' : 'text-3xl font-bold text-negative';
        
        unrealizedPercentElement.textContent = `${(metrics.unrealizedPL / metrics.totalCost * 100).toFixed(2)}%`;
        
        // Realized P&L
        const realizedPL = metrics.realizedPL * rate;
        const realizedElement = document.getElementById('realized-pl');
        
        realizedElement.textContent = Utils.formatCurrency(realizedPL, this.currentCurrency);
        realizedElement.className = realizedPL >= 0 ? 'text-3xl font-bold text-positive' : 'text-3xl font-bold text-negative';
        
        // Total Dividends
        const totalDividends = metrics.totalDividends * rate;
        document.getElementById('total-dividends').textContent = Utils.formatCurrency(totalDividends, this.currentCurrency);
        document.getElementById('dividend-yield').textContent = `Yield: ${metrics.dividendYield.toFixed(2)}%`;
    }

    updateAdvancedAnalytics(metrics) {
        document.getElementById('sharpe-ratio').textContent = metrics.sharpeRatio.toFixed(2);
        document.getElementById('max-drawdown').textContent = `${metrics.maxDrawdown.toFixed(2)}%`;
        document.getElementById('volatility').textContent = `${metrics.volatility.toFixed(2)}%`;
        
        const rate = this.getExchangeRate();
        document.getElementById('var-95').textContent = Utils.formatCurrency(metrics.var95 * rate, this.currentCurrency);
        document.getElementById('beta').textContent = metrics.beta.toFixed(2);
    }

    updateHoldingsTable() {
        const tbody = document.getElementById('holdings-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const rate = this.getExchangeRate();
        const symbol = this.currentCurrency === 'PLN' ? 'zł' : '$';
        
        this.analytics.holdings.forEach((holding, holdingSymbol) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const marketValue = holding.marketValue * rate;
            const costBasis = holding.totalCost * rate;
            const unrealizedPL = holding.unrealizedPL * rate;
            const unrealizedPercent = holding.totalCost > 0 ? (holding.unrealizedPL / holding.totalCost) * 100 : 0;
            const realizedPL = holding.realizedPL * rate;
            const dividends = holding.totalDividends * rate;
            const totalPL = unrealizedPL + realizedPL + dividends;
            const totalYield = holding.totalCost > 0 ? (totalPL / costBasis) * 100 : 0;
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div>
                            <div class="text-sm font-medium text-gray-900">${holdingSymbol}</div>
                            <div class="text-sm text-gray-500">${holding.sector}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${holding.units.toFixed(6)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${Utils.formatCurrency(holding.currentPrice * rate, this.currentCurrency)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${Utils.formatCurrency(marketValue, this.currentCurrency)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${Utils.formatCurrency(costBasis, this.currentCurrency)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm ${unrealizedPL >= 0 ? 'text-positive' : 'text-negative'}">
                    ${Utils.formatCurrency(unrealizedPL, this.currentCurrency)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm ${unrealizedPercent >= 0 ? 'text-positive' : 'text-negative'}">
                    ${unrealizedPercent.toFixed(2)}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm ${realizedPL >= 0 ? 'text-positive' : 'text-negative'}">
                    ${Utils.formatCurrency(realizedPL, this.currentCurrency)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-positive">
                    ${Utils.formatCurrency(dividends, this.currentCurrency)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${totalYield >= 0 ? 'text-positive' : 'text-negative'}">
                    ${totalYield.toFixed(2)}%
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    updateCharts() {
        // Generate sample daily data for charts
        const dailyData = this.generateDailyPortfolioData();
        
        // Update all charts
        this.charts.updatePortfolioValueChart(dailyData);
        this.charts.updatePLChart(dailyData);
        
        // Update allocation charts
        const metrics = this.analytics.calculatePortfolioMetrics(this.currentPeriod);
        this.charts.updateAllocationCharts({
            markets: metrics.marketAllocation,
            sectors: metrics.sectorAllocation,
            currencies: metrics.currencyExposure
        });
    }

    updateTaxSummary() {
        const currentYear = new Date().getFullYear();
        const taxData = this.analytics.calculateTaxLiability(currentYear);
        const rate = this.getExchangeRate();
        
        document.getElementById('tax-pl-div').textContent = Utils.formatCurrency(taxData.plStockDividends * rate, this.currentCurrency);
        document.getElementById('tax-pl-gains').textContent = Utils.formatCurrency(taxData.plStockGains * rate, this.currentCurrency);
        document.getElementById('tax-us-div').textContent = Utils.formatCurrency(taxData.usStockDividends * rate, this.currentCurrency);
        document.getElementById('tax-us-gains').textContent = Utils.formatCurrency(taxData.usStockGains * rate, this.currentCurrency);
        document.getElementById('tax-crypto-gains').textContent = Utils.formatCurrency(taxData.cryptoGains * rate, this.currentCurrency);
        document.getElementById('tax-owed').textContent = Utils.formatCurrency(taxData.totalTaxOwed * rate, this.currentCurrency);
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pl-PL');
        document.getElementById('last-update').textContent = `Last update: ${timeString}`;
        this.lastUpdate = now;
    }

    // ===== HELPER METHODS =====

    getExchangeRate() {
        if (this.currentCurrency === 'USD') return 1;
        
        const rateData = this.exchangeRates.get('USD/PLN');
        return rateData ? rateData.rate : 4.0; // Fallback rate
    }

    generateDailyPortfolioData() {
        // Generate sample daily data for the last year
        const data = [];
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        
        let currentValue = 100000; // Starting value
        let currentCost = 100000;
        let realizedPL = 0;
        
        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            // Simple random walk for demonstration
            const dailyReturn = (Math.random() - 0.5) * 0.04; // ±2% daily volatility
            currentValue *= (1 + dailyReturn);
            
            // Occasionally add to realized P&L
            if (Math.random() < 0.02) { // 2% chance per day
                const trade = (Math.random() - 0.5) * 1000;
                realizedPL += trade;
            }
            
            data.push({
                date: new Date(d),
                marketValue: currentValue,
                costBasis: currentCost,
                unrealizedPL: currentValue - currentCost,
                realizedPL: realizedPL
            });
        }
        
        return data;
    }

    // ===== FILTERING AND SEARCH =====

    filterHoldings(searchTerm) {
        const tbody = document.getElementById('holdings-table-body');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const symbol = row.querySelector('td:first-child .text-sm.font-medium').textContent.toLowerCase();
            const sector = row.querySelector('td:first-child .text-sm.text-gray-500').textContent.toLowerCase();
            
            const matches = symbol.includes(searchTerm.toLowerCase()) || sector.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    filterHoldingsByMarket(market) {
        // This would filter holdings table by market type
        // Implementation depends on how market info is stored in the display
        console.log('Filtering by market:', market);
    }

    // ===== UTILITY METHODS =====

    async refreshData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const button = document.getElementById('refresh-btn');
        const originalText = button.textContent;
        
        try {
            button.textContent = '🔄 Refreshing...';
            button.disabled = true;
            
            await this.updatePrices();
            await this.updateExchangeRates();
            await this.updateAllDisplays();
            
            console.log('✅ Data refresh completed');
            
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            this.showError('Failed to refresh data. Please try again.');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
            this.isLoading = false;
        }
    }

    exportData() {
        // Export portfolio data to CSV/Excel
        console.log('📊 Exporting portfolio data...');
        
        const holdings = Array.from(this.analytics.holdings.entries());
        const csvData = [
            ['Symbol', 'Market', 'Units', 'Current Price', 'Market Value', 'Cost Basis', 'Unrealized P&L', 'Realized P&L', 'Dividends'],
            ...holdings.map(([symbol, holding]) => [
                symbol,
                holding.market,
                holding.units,
                holding.currentPrice,
                holding.marketValue,
                holding.totalCost,
                holding.unrealizedPL,
                holding.realizedPL,
                holding.totalDividends
            ])
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio_${Utils.formatDate(new Date())}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        console.error(message);
        // Could implement toast notifications here
        alert(message); // Simple fallback
    }

    // ===== CLEANUP =====

    destroy() {
        // Clear intervals
        Object.values(this.updateIntervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        // Destroy charts
        this.charts.destroyAllCharts();
        
        console.log('🧹 Portfolio tracker cleaned up');
    }
}

// ===== APPLICATION STARTUP =====

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Elite Portfolio Analytics Platform starting up...');
    
    // Initialize the main application
    window.portfolioApp = new PortfolioTracker();
    
    // Global error handling
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.portfolioApp) {
            window.portfolioApp.destroy();
        }
    });
});

// Export for external access
window.PortfolioTracker = PortfolioTracker;