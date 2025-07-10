// Elite Portfolio Analytics Engine
// Advanced financial calculations, risk metrics, and statistical analysis

class PortfolioAnalytics {
    constructor() {
        this.transactions = [];
        this.holdings = new Map();
        this.dailyPortfolioValues = new Map();
        this.priceHistory = new Map();
        this.exchangeRates = new Map();
        this.benchmarkData = new Map();
        
        // Performance cache
        this.metricsCache = new Map();
        this.lastCalculation = null;
    }

    // ===== TRANSACTION PROCESSING =====
    
    processTransactions(rawTransactions) {
        console.log('Processing transactions...', rawTransactions.length);
        
        this.transactions = rawTransactions
            .filter(tx => tx.date && tx.type && tx.market)
            .map(tx => ({
                ...tx,
                date: new Date(tx.date),
                units: parseFloat(tx.units) || 0,
                price: parseFloat(tx.txPrice) || 0,
                fees: parseFloat(tx.fees) || 0,
                split: parseFloat(tx.split) || 1.0
            }))
            .sort((a, b) => a.date - b.date);

        this.buildHoldingsFromTransactions();
        return this.transactions;
    }

    buildHoldingsFromTransactions() {
        this.holdings.clear();
        
        // Group transactions by symbol
        const symbolTransactions = new Map();
        
        this.transactions.forEach(tx => {
            if (!symbolTransactions.has(tx.symbol)) {
                symbolTransactions.set(tx.symbol, []);
            }
            symbolTransactions.get(tx.symbol).push(tx);
        });

        // Process each symbol's transactions using FIFO
        symbolTransactions.forEach((txs, symbol) => {
            const holding = this.calculateHoldingPosition(txs);
            if (holding.units > 0) {
                this.holdings.set(symbol, holding);
            }
        });
    }

    calculateHoldingPosition(transactions) {
        const lots = []; // FIFO lots for cost basis calculation
        let totalDividends = 0;
        let realizedPL = 0;
        
        const lastTx = transactions[transactions.length - 1];
        const holding = {
            symbol: lastTx.symbol,
            market: lastTx.market,
            currency: lastTx.currency,
            units: 0,
            costBasis: 0,
            totalCost: 0,
            averageCost: 0,
            totalDividends: 0,
            realizedPL: 0,
            unrealizedPL: 0,
            currentPrice: 0,
            marketValue: 0,
            firstPurchaseDate: null,
            lastTradeDate: null,
            sector: this.getSector(lastTx.symbol)
        };

        transactions.forEach(tx => {
            switch (tx.type) {
                case CONFIG.TRANSACTION_TYPES.BUY:
                    // Add new lot
                    lots.push({
                        units: tx.units,
                        costPerUnit: tx.price,
                        totalCost: tx.units * tx.price + tx.fees,
                        date: tx.date
                    });
                    
                    holding.units += tx.units;
                    holding.totalCost += tx.units * tx.price + tx.fees;
                    
                    if (!holding.firstPurchaseDate) {
                        holding.firstPurchaseDate = tx.date;
                    }
                    holding.lastTradeDate = tx.date;
                    break;

                case CONFIG.TRANSACTION_TYPES.SELL:
                    // Sell using FIFO
                    let remainingToSell = tx.units;
                    let sellProceeds = tx.units * tx.price - tx.fees;
                    let sellCost = 0;

                    while (remainingToSell > 0 && lots.length > 0) {
                        const lot = lots[0];
                        const unitsFromThisLot = Math.min(remainingToSell, lot.units);
                        const costFromThisLot = unitsFromThisLot * lot.costPerUnit;
                        
                        sellCost += costFromThisLot;
                        lot.units -= unitsFromThisLot;
                        lot.totalCost -= costFromThisLot;
                        remainingToSell -= unitsFromThisLot;

                        if (lot.units <= 0) {
                            lots.shift(); // Remove empty lot
                        }
                    }

                    const tradeRealizedPL = sellProceeds - sellCost;
                    realizedPL += tradeRealizedPL;
                    
                    holding.units -= tx.units;
                    holding.totalCost -= sellCost;
                    holding.lastTradeDate = tx.date;
                    break;

                case CONFIG.TRANSACTION_TYPES.DIVIDEND:
                    totalDividends += tx.units * tx.price; // units = dividend per share, price = 1 usually
                    break;

                case CONFIG.TRANSACTION_TYPES.SPLIT:
                    // Adjust all lots for stock split
                    lots.forEach(lot => {
                        lot.units *= tx.split;
                        lot.costPerUnit /= tx.split;
                    });
                    holding.units *= tx.split;
                    break;

                case CONFIG.TRANSACTION_TYPES.CAPITAL_REDUCTION:
                    // Handle spin-offs and capital reductions
                    const reductionAmount = tx.units * tx.price;
                    holding.totalCost -= reductionAmount;
                    totalDividends += reductionAmount; // Treat as dividend for tax purposes
                    break;
            }
        });

        // Calculate final metrics
        holding.averageCost = holding.units > 0 ? holding.totalCost / holding.units : 0;
        holding.costBasis = holding.averageCost;
        holding.totalDividends = totalDividends;
        holding.realizedPL = realizedPL;

        return holding;
    }

    // ===== RISK METRICS =====

    calculatePortfolioMetrics(selectedPeriod = '1Y') {
        const cacheKey = `metrics_${selectedPeriod}`;
        
        if (this.metricsCache.has(cacheKey) && 
            Date.now() - this.lastCalculation < CONFIG.PERFORMANCE.CACHE_DURATION) {
            return this.metricsCache.get(cacheKey);
        }

        const metrics = {
            totalValue: 0,
            totalCost: 0,
            unrealizedPL: 0,
            realizedPL: 0,
            totalPL: 0,
            totalDividends: 0,
            
            // Risk metrics
            sharpeRatio: 0,
            sortinoratio: 0,
            maxDrawdown: 0,
            volatility: 0,
            var95: 0,
            var99: 0,
            beta: 0,
            
            // Performance metrics
            cagr: 0,
            totalReturn: 0,
            dividendYield: 0,
            
            // Allocation
            marketAllocation: new Map(),
            sectorAllocation: new Map(),
            currencyExposure: new Map(),
            
            // Benchmark comparison
            benchmarkComparison: new Map()
        };

        // Calculate basic portfolio metrics
        this.holdings.forEach(holding => {
            metrics.totalValue += holding.marketValue;
            metrics.totalCost += holding.totalCost;
            metrics.unrealizedPL += holding.unrealizedPL;
            metrics.realizedPL += holding.realizedPL;
            metrics.totalDividends += holding.totalDividends;
            
            // Market allocation
            const marketValue = metrics.marketAllocation.get(holding.market) || 0;
            metrics.marketAllocation.set(holding.market, marketValue + holding.marketValue);
            
            // Sector allocation
            const sectorValue = metrics.sectorAllocation.get(holding.sector) || 0;
            metrics.sectorAllocation.set(holding.sector, sectorValue + holding.marketValue);
            
            // Currency exposure
            const currencyValue = metrics.currencyExposure.get(holding.currency) || 0;
            metrics.currencyExposure.set(holding.currency, currencyValue + holding.marketValue);
        });

        metrics.totalPL = metrics.unrealizedPL + metrics.realizedPL;
        metrics.totalReturn = metrics.totalCost > 0 ? (metrics.totalPL / metrics.totalCost) * 100 : 0;
        metrics.dividendYield = metrics.totalValue > 0 ? (metrics.totalDividends / metrics.totalValue) * 100 : 0;

        // Calculate time-series based metrics
        const dailyReturns = this.calculateDailyReturns(selectedPeriod);
        if (dailyReturns.length > 0) {
            metrics.volatility = this.calculateVolatility(dailyReturns) * Math.sqrt(252) * 100; // Annualized
            metrics.sharpeRatio = this.calculateSharpeRatio(dailyReturns);
            metrics.sortinoratio = this.calculateSortinoRatio(dailyReturns);
            metrics.maxDrawdown = this.calculateMaxDrawdown(selectedPeriod);
            metrics.var95 = this.calculateVaR(dailyReturns, 0.05) * metrics.totalValue;
            metrics.var99 = this.calculateVaR(dailyReturns, 0.01) * metrics.totalValue;
            metrics.cagr = this.calculateCAGR(selectedPeriod);
            
            // Beta calculation (vs S&P 500)
            metrics.beta = this.calculateBeta(dailyReturns, 'SPY', selectedPeriod);
        }

        this.metricsCache.set(cacheKey, metrics);
        this.lastCalculation = Date.now();
        
        return metrics;
    }

    calculateDailyReturns(period) {
        const portfolioValues = Array.from(this.dailyPortfolioValues.entries())
            .filter(([date]) => this.isDateInPeriod(new Date(date), period))
            .sort(([a], [b]) => new Date(a) - new Date(b));

        const returns = [];
        for (let i = 1; i < portfolioValues.length; i++) {
            const previousValue = portfolioValues[i - 1][1];
            const currentValue = portfolioValues[i][1];
            
            if (previousValue > 0) {
                const dailyReturn = (currentValue - previousValue) / previousValue;
                returns.push(dailyReturn);
            }
        }
        
        return returns;
    }

    calculateVolatility(returns) {
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
        
        return Math.sqrt(variance);
    }

    calculateSharpeRatio(returns) {
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const volatility = this.calculateVolatility(returns);
        const riskFreeDaily = CONFIG.RISK_FREE_RATE / 252; // Daily risk-free rate
        
        if (volatility === 0) return 0;
        
        return ((mean - riskFreeDaily) / volatility) * Math.sqrt(252); // Annualized
    }

    calculateSortinoRatio(returns) {
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const riskFreeDaily = CONFIG.RISK_FREE_RATE / 252;
        const downwardReturns = returns.filter(r => r < mean);
        
        if (downwardReturns.length === 0) return Infinity;
        
        const downwardDeviation = Math.sqrt(
            downwardReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / downwardReturns.length
        );
        
        if (downwardDeviation === 0) return 0;
        
        return ((mean - riskFreeDaily) / downwardDeviation) * Math.sqrt(252);
    }

    calculateMaxDrawdown(period) {
        const portfolioValues = Array.from(this.dailyPortfolioValues.entries())
            .filter(([date]) => this.isDateInPeriod(new Date(date), period))
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([_, value]) => value);

        if (portfolioValues.length < 2) return 0;

        let maxDrawdown = 0;
        let peak = portfolioValues[0];

        portfolioValues.forEach(value => {
            if (value > peak) {
                peak = value;
            }
            
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        });

        return maxDrawdown * 100; // Return as percentage
    }

    calculateVaR(returns, confidence) {
        if (returns.length < 10) return 0;
        
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor(confidence * sortedReturns.length);
        
        return sortedReturns[index];
    }

    calculateCAGR(period) {
        const portfolioValues = Array.from(this.dailyPortfolioValues.entries())
            .filter(([date]) => this.isDateInPeriod(new Date(date), period))
            .sort(([a], [b]) => new Date(a) - new Date(b));

        if (portfolioValues.length < 2) return 0;

        const startValue = portfolioValues[0][1];
        const endValue = portfolioValues[portfolioValues.length - 1][1];
        const startDate = new Date(portfolioValues[0][0]);
        const endDate = new Date(portfolioValues[portfolioValues.length - 1][0]);
        
        const years = (endDate - startDate) / (365.25 * 24 * 60 * 60 * 1000);
        
        if (years <= 0 || startValue <= 0) return 0;
        
        return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    }

    calculateBeta(portfolioReturns, benchmarkSymbol, period) {
        const benchmarkReturns = this.getBenchmarkReturns(benchmarkSymbol, period);
        
        if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 10) {
            return 0;
        }

        // Calculate covariance and benchmark variance
        const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
        const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;
        
        let covariance = 0;
        let benchmarkVariance = 0;
        
        for (let i = 0; i < portfolioReturns.length; i++) {
            const portfolioDiff = portfolioReturns[i] - portfolioMean;
            const benchmarkDiff = benchmarkReturns[i] - benchmarkMean;
            
            covariance += portfolioDiff * benchmarkDiff;
            benchmarkVariance += benchmarkDiff * benchmarkDiff;
        }
        
        covariance /= (portfolioReturns.length - 1);
        benchmarkVariance /= (benchmarkReturns.length - 1);
        
        return benchmarkVariance === 0 ? 0 : covariance / benchmarkVariance;
    }

    // ===== TAX CALCULATIONS =====

    calculateTaxLiability(year = new Date().getFullYear()) {
        const taxData = {
            year: year,
            plStockDividends: 0,
            plStockGains: 0,
            usStockDividends: 0,
            usStockGains: 0,
            cryptoGains: 0,
            totalTaxOwed: 0
        };

        // Filter transactions for the specific year
        const yearTransactions = this.transactions.filter(tx => tx.date.getFullYear() === year);

        yearTransactions.forEach(tx => {
            if (tx.type === CONFIG.TRANSACTION_TYPES.DIVIDEND) {
                const dividendAmount = tx.units * tx.price;
                
                if (tx.market === CONFIG.MARKETS.PL) {
                    taxData.plStockDividends += dividendAmount;
                } else if (tx.market === CONFIG.MARKETS.US) {
                    taxData.usStockDividends += dividendAmount;
                }
            } else if (tx.type === CONFIG.TRANSACTION_TYPES.SELL) {
                // Calculate realized gains for this sale
                const holding = this.holdings.get(tx.symbol);
                if (holding && holding.realizedPL !== 0) {
                    const gainAmount = holding.realizedPL; // This would need to be calculated per transaction
                    
                    if (tx.market === CONFIG.MARKETS.PL) {
                        taxData.plStockGains += Math.max(0, gainAmount);
                    } else if (tx.market === CONFIG.MARKETS.US) {
                        taxData.usStockGains += Math.max(0, gainAmount);
                    } else if (tx.market === CONFIG.MARKETS.CRYPTO) {
                        taxData.cryptoGains += Math.max(0, gainAmount);
                    }
                }
            }
        });

        // Calculate tax owed based on Polish tax rates
        const plTax = (taxData.plStockDividends + taxData.plStockGains) * CONFIG.TAX_RATES.PL_STOCKS.DIVIDEND;
        const usDividendTax = taxData.usStockDividends * CONFIG.TAX_RATES.US_STOCKS.DIVIDEND_ADDITIONAL; // Additional 4%
        const usGainsTax = taxData.usStockGains * CONFIG.TAX_RATES.US_STOCKS.CAPITAL_GAINS;
        const cryptoTax = taxData.cryptoGains * CONFIG.TAX_RATES.CRYPTO.CAPITAL_GAINS;

        taxData.totalTaxOwed = plTax + usDividendTax + usGainsTax + cryptoTax;

        return taxData;
    }

    // ===== UTILITY METHODS =====

    getSector(symbol) {
        return CONFIG.SECTORS[symbol] || 'Unknown';
    }

    getBenchmarkReturns(symbol, period) {
        // This would fetch benchmark data from stored benchmark history
        // For now, return empty array - to be implemented with real data
        return [];
    }

    isDateInPeriod(date, period) {
        const now = new Date();
        const diffTime = now - date;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (period) {
            case '1M': return diffDays <= 30;
            case '3M': return diffDays <= 90;
            case '6M': return diffDays <= 180;
            case '1Y': return diffDays <= 365;
            case '3Y': return diffDays <= 1095;
            case '5Y': return diffDays <= 1825;
            case 'ALL': return true;
            default: return diffDays <= 365;
        }
    }

    // ===== DATA UPDATES =====

    updatePrices(priceData) {
        this.holdings.forEach((holding, symbol) => {
            if (priceData.has(symbol)) {
                const price = priceData.get(symbol);
                holding.currentPrice = price;
                holding.marketValue = holding.units * price;
                holding.unrealizedPL = holding.marketValue - holding.totalCost;
            }
        });

        // Update daily portfolio value
        const totalValue = Array.from(this.holdings.values())
            .reduce((sum, holding) => sum + holding.marketValue, 0);
        
        const today = Utils.formatDate(new Date());
        this.dailyPortfolioValues.set(today, totalValue);
    }

    // ===== MONTE CARLO SIMULATION =====

    runMonteCarloSimulation(scenarios = 1000, timeHorizon = 252) {
        const dailyReturns = this.calculateDailyReturns('ALL');
        if (dailyReturns.length < 50) return null;

        const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
        const volatility = this.calculateVolatility(dailyReturns);
        const currentValue = Array.from(this.holdings.values())
            .reduce((sum, holding) => sum + holding.marketValue, 0);

        const results = [];

        for (let scenario = 0; scenario < scenarios; scenario++) {
            let value = currentValue;
            
            for (let day = 0; day < timeHorizon; day++) {
                // Generate random return using normal distribution (Box-Muller transform)
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                
                const dailyReturn = meanReturn + volatility * z;
                value *= (1 + dailyReturn);
            }
            
            results.push(value);
        }

        results.sort((a, b) => a - b);

        return {
            currentValue: currentValue,
            scenarios: results,
            percentiles: {
                p5: results[Math.floor(scenarios * 0.05)],
                p25: results[Math.floor(scenarios * 0.25)],
                p50: results[Math.floor(scenarios * 0.50)],
                p75: results[Math.floor(scenarios * 0.75)],
                p95: results[Math.floor(scenarios * 0.95)]
            },
            probabilityOfLoss: results.filter(r => r < currentValue).length / scenarios
        };
    }

    // ===== CORRELATION ANALYSIS =====

    calculateCorrelationMatrix() {
        const correlations = new Map();
        const holdings = Array.from(this.holdings.keys());

        holdings.forEach(symbol1 => {
            holdings.forEach(symbol2 => {
                if (symbol1 !== symbol2) {
                    const key = `${symbol1}_${symbol2}`;
                    const reverseKey = `${symbol2}_${symbol1}`;
                    
                    if (!correlations.has(key) && !correlations.has(reverseKey)) {
                        const correlation = this.calculatePairCorrelation(symbol1, symbol2);
                        correlations.set(key, correlation);
                    }
                }
            });
        });

        return correlations;
    }

    calculatePairCorrelation(symbol1, symbol2) {
        // This would calculate correlation using price history
        // For now, return random correlation for demonstration
        return (Math.random() - 0.5) * 2; // Random correlation between -1 and 1
    }
}

// Export the analytics class
window.PortfolioAnalytics = PortfolioAnalytics;