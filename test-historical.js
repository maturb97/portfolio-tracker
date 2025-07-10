// Test Historical Portfolio Calculation
// This will test the first 100 transactions from Google Sheets

const CONFIG = {
    GOOGLE_SHEETS_API_KEY: 'AIzaSyCOQSG4yD4SzdrQDJH2oVJGazduyzgwq04',
    SHEET_ID: '10NuWmVJXpI1xeiiFXY5jtGHQ_SNcRbQUGS2kRyGmAKg',
    SHEET_RANGE: 'Sheet1!A1:I101' // First 100 transactions
};

class HistoricalCalculator {
    constructor() {
        this.transactions = [];
        this.historicalData = [];
        this.exchangeRates = new Map();
        this.historicalPrices = new Map();
    }

    async loadTransactions() {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_RANGE}?key=${CONFIG.GOOGLE_SHEETS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        // Parse transactions (skip header)
        this.transactions = data.values.slice(1).map(row => ({
            date: row[0],
            type: row[1],
            market: row[2],
            symbol: row[3] || 'Unknown',
            units: parseFloat(row[4]) || 0,
            price: parseFloat(row[5]) || 0,
            fees: parseFloat(row[6]) || 0,
            split: parseFloat(row[7]) || 1.0,
            currency: row[8] || 'USD'
        })).filter(tx => tx.date && tx.type);
        
        console.log(`Loaded ${this.transactions.length} transactions`);
        console.log('Date range:', this.transactions[0].date, 'to', this.transactions[this.transactions.length - 1].date);
        
        return this.transactions;
    }

    async fetchHistoricalPrice(symbol, date, market) {
        const dateStr = date.toISOString().split('T')[0];
        const cacheKey = `${symbol}-${dateStr}`;
        
        if (this.historicalPrices.has(cacheKey)) {
            return this.historicalPrices.get(cacheKey);
        }

        let price = null;
        
        try {
            if (market === 'CRYPTO') {
                // CryptoCompare historical API
                const cryptoSymbols = {
                    'Bitcoin': 'BTC', 'BTC': 'BTC',
                    'Ethereum': 'ETH', 'ETH': 'ETH', 
                    'DOT': 'DOT'
                };
                
                const cryptoSymbol = cryptoSymbols[symbol];
                if (cryptoSymbol) {
                    // Convert date to timestamp
                    const timestamp = Math.floor(date.getTime() / 1000);
                    const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${cryptoSymbol}&tsym=USD&limit=1&toTs=${timestamp}`;
                    
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    if (data.Response === 'Success' && data.Data && data.Data.Data && data.Data.Data[0]) {
                        price = data.Data.Data[0].close;
                        console.log(`✅ ${symbol} crypto price on ${dateStr}: $${price}`);
                    }
                }
            } else if (market === 'PL') {
                // Polish stocks - Yahoo Finance
                const yahooSymbol = symbol + '.WA';
                const startDate = Math.floor(date.getTime() / 1000);
                const endDate = startDate + 86400; // +1 day
                
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
                const response = await fetch(url);
                const data = await response.json();
                
                const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0];
                if (quotes && quotes.close && quotes.close[0]) {
                    price = quotes.close[0];
                }
            } else if (market === 'US') {
                // US stocks - Yahoo Finance
                const startDate = Math.floor(date.getTime() / 1000);
                const endDate = startDate + 86400;
                
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
                const response = await fetch(url);
                const data = await response.json();
                
                const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0];
                if (quotes && quotes.close && quotes.close[0]) {
                    price = quotes.close[0];
                }
            }
            
            if (price && price > 0) {
                this.historicalPrices.set(cacheKey, price);
                console.log(`✅ ${symbol} on ${dateStr}: $${price}`);
                return price;
            }
            
        } catch (error) {
            console.error(`❌ Failed to fetch ${symbol} for ${dateStr}:`, error.message);
        }
        
        // Return null if no price found
        return null;
    }

    async fetchHistoricalExchangeRate(date) {
        const dateStr = date.toISOString().split('T')[0];
        
        if (this.exchangeRates.has(dateStr)) {
            return this.exchangeRates.get(dateStr);
        }

        try {
            const url = `https://api.nbp.pl/api/exchangerates/rates/a/usd/${dateStr}/`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const rate = data.rates[0].mid;
                this.exchangeRates.set(dateStr, rate);
                return rate;
            }
        } catch (error) {
            console.error(`Exchange rate fetch failed for ${dateStr}:`, error.message);
        }
        
        // Fallback rate
        return 3.8;
    }

    async calculateHistoricalPortfolio() {
        console.log('Starting historical portfolio calculation...');
        
        // Get unique dates from transactions
        const transactionDates = [...new Set(this.transactions.map(tx => tx.date))].sort();
        const startDate = new Date(transactionDates[0]);
        const endDate = new Date(transactionDates[transactionDates.length - 1]);
        
        console.log(`Calculating from ${startDate.toDateString()} to ${endDate.toDateString()}`);
        
        const results = [];
        const holdings = new Map();
        
        // Process each day
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            
            // Apply transactions for this date
            const dayTransactions = this.transactions.filter(tx => tx.date === dateStr);
            
            for (const tx of dayTransactions) {
                if (!holdings.has(tx.symbol)) {
                    holdings.set(tx.symbol, {
                        symbol: tx.symbol,
                        market: tx.market,
                        currency: tx.currency,
                        units: 0,
                        totalCost: 0,
                        fifoQueue: []
                    });
                }
                
                const holding = holdings.get(tx.symbol);
                
                switch (tx.type.toLowerCase()) {
                    case 'buy':
                        holding.fifoQueue.push({
                            units: tx.units,
                            costPerUnit: tx.price + (tx.fees / tx.units)
                        });
                        holding.units += tx.units;
                        holding.totalCost += (tx.units * tx.price) + tx.fees;
                        break;
                    // Add other transaction types as needed
                }
            }
            
            // Calculate portfolio value for this date
            if (dayTransactions.length > 0) {
                let portfolioValue = 0;
                const exchangeRate = await this.fetchHistoricalExchangeRate(date);
                
                for (const [symbol, holding] of holdings) {
                    if (holding.units > 0) {
                        const price = await this.fetchHistoricalPrice(symbol, date, holding.market);
                        if (price) {
                            let valueInPLN = price;
                            if (holding.currency === 'USD') {
                                valueInPLN = price * exchangeRate;
                            }
                            portfolioValue += holding.units * valueInPLN;
                        }
                    }
                }
                
                results.push({
                    date: dateStr,
                    portfolioValue: Math.round(portfolioValue * 100) / 100,
                    exchangeRate: exchangeRate,
                    holdings: holdings.size
                });
                
                console.log(`${dateStr}: zł${portfolioValue.toFixed(2)} (${holdings.size} holdings)`);
            }
        }
        
        return results;
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoricalCalculator;
}

// Test execution
async function runTest() {
    const calculator = new HistoricalCalculator();
    
    try {
        await calculator.loadTransactions();
        const results = await calculator.calculateHistoricalPortfolio();
        
        console.log('\n=== HISTORICAL CALCULATION RESULTS ===');
        console.log('Total data points:', results.length);
        console.log('First value:', results[0]);
        console.log('Last value:', results[results.length - 1]);
        
        return results;
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
    runTest();
}