// Elite Portfolio Analytics Platform - Configuration
// Professional-grade portfolio tracker with advanced analytics

const CONFIG = {
    // API Configuration
    GOOGLE_SHEETS: {
        API_KEY: 'AIzaSyCOQSG4yD4SzdrQDJH2oVJGazduyzgwq04',
        BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
        SHEET_ID: '10NuWmVJXpI1xeiiFXY5jtGHQ_SNcRbQUGS2kRyGmAKg',
        RANGE: 'Sheet1!A:H'
    },

    // Price Data APIs
    PRICE_APIS: {
        // Primary: Yahoo Finance
        YAHOO: {
            BASE_URL: 'https://query1.finance.yahoo.com',
            CHART_URL: '/v8/finance/chart',
            QUOTE_URL: '/v7/finance/quote'
        },
        
        // Crypto: CoinGecko
        COINGECKO: {
            BASE_URL: 'https://api.coingecko.com/api/v3',
            SIMPLE_PRICE: '/simple/price',
            HISTORICAL: '/coins/{id}/history'
        },

        // Exchange Rates: NBP (Polish National Bank)
        NBP: {
            BASE_URL: 'https://api.nbp.pl/api',
            RATES: '/exchangerates/rates/a'
        },

        // Benchmark Data
        BENCHMARKS: {
            BASE_URL: 'https://query1.finance.yahoo.com/v8/finance/chart'
        }
    },

    // Update Frequencies
    UPDATE_INTERVALS: {
        PRICES: 60 * 60 * 1000,        // 1 hour
        EXCHANGE_RATES: 24 * 60 * 60 * 1000,  // Daily
        BENCHMARKS: 60 * 60 * 1000     // 1 hour
    },

    // Tax Configuration (Polish Tax Law)
    TAX_RATES: {
        PL_STOCKS: {
            DIVIDEND: 0.19,    // 19% on dividends
            CAPITAL_GAINS: 0.19 // 19% on capital gains
        },
        US_STOCKS: {
            DIVIDEND_WITHHELD: 0.15,  // 15% withheld by broker (W8BEN)
            DIVIDEND_ADDITIONAL: 0.04, // 4% additional to Polish tax office
            CAPITAL_GAINS: 0.19       // 19% on capital gains
        },
        CRYPTO: {
            CAPITAL_GAINS: 0.19       // 19% on capital gains
        }
    },

    // Benchmark Tickers and Weights
    BENCHMARKS: {
        'SPY': { name: 'S&P 500', weight: 0.4 },
        'DJI': { name: 'Dow Jones', weight: 0.1 },
        'WIG20': { name: 'WIG20', weight: 0.3 },
        'BTC-USD': { name: 'Bitcoin', weight: 0.1 },
        'MSCI': { name: 'MSCI World', weight: 0.1 },
        'VTI': { name: 'US Total Market', weight: 0.0 },
        'VXUS': { name: 'Int\'l ex-US', weight: 0.0 }
    },

    // Risk-Free Rate (Polish 10Y Bond)
    RISK_FREE_RATE: 0.055, // 5.5% annual

    // Transaction Types
    TRANSACTION_TYPES: {
        BUY: 'Buy',
        SELL: 'Sell',
        DIVIDEND: 'Div',
        CAPITAL_REDUCTION: 'CapReduct',
        SPLIT: 'Split'
    },

    // Market Classifications
    MARKETS: {
        US: 'US',
        PL: 'PL', 
        CRYPTO: 'CRYPTO',
        PHYSICAL: 'PHYSICAL'
    },

    // Currencies
    CURRENCIES: {
        USD: 'USD',
        PLN: 'PLN'
    },

    // Cost Basis Methods
    COST_BASIS_METHODS: {
        FIFO: 'FIFO',  // Recommended for Polish tax law
        LIFO: 'LIFO',
        AVERAGE: 'AVERAGE'
    },

    // Chart Colors (Professional palette)
    COLORS: {
        PRIMARY: '#3B82F6',      // Blue
        SUCCESS: '#10B981',      // Green
        DANGER: '#EF4444',       // Red
        WARNING: '#F59E0B',      // Amber
        INFO: '#8B5CF6',         // Purple
        SECONDARY: '#6B7280',    // Gray
        
        // Chart palette
        CHART_COLORS: [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ]
    },

    // Sector Classifications (GICS)
    SECTORS: {
        'AAPL': 'Information Technology',
        'MSFT': 'Information Technology', 
        'GOOGL': 'Communication Services',
        'AMZN': 'Consumer Discretionary',
        'TSLA': 'Consumer Discretionary',
        'META': 'Communication Services',
        'NVDA': 'Information Technology',
        'JPM': 'Financials',
        'JNJ': 'Health Care',
        'PG': 'Consumer Staples',
        'V': 'Information Technology',
        'HD': 'Consumer Discretionary',
        'UNH': 'Health Care',
        'MA': 'Information Technology',
        'PFE': 'Health Care',
        'BAC': 'Financials',
        'XOM': 'Energy',
        'WMT': 'Consumer Staples',
        'DIS': 'Communication Services',
        'CRM': 'Information Technology',
        'NFLX': 'Communication Services',
        'ADBE': 'Information Technology',
        'CVX': 'Energy',
        'ABT': 'Health Care',
        'COP': 'Energy',
        'TMO': 'Health Care',
        'COST': 'Consumer Staples',
        'ACN': 'Information Technology',
        'MRK': 'Health Care',
        'LLY': 'Health Care',
        'ABBV': 'Health Care',
        'ORCL': 'Information Technology',
        'KO': 'Consumer Staples',
        'PEP': 'Consumer Staples',
        'DHR': 'Health Care',
        'MDT': 'Health Care',
        'BMY': 'Health Care',
        'T': 'Communication Services',
        'VZ': 'Communication Services',
        'INTC': 'Information Technology',
        'CSCO': 'Information Technology',
        'WFC': 'Financials',
        'CVS': 'Health Care',
        'IBM': 'Information Technology',
        'AMD': 'Information Technology',
        'QCOM': 'Information Technology',
        'AMGN': 'Health Care',
        'HON': 'Industrials',
        'UPS': 'Industrials',
        'LOW': 'Consumer Discretionary',
        'SPGI': 'Financials',
        'GS': 'Financials',
        'CAT': 'Industrials',
        'AXP': 'Financials',
        'BLK': 'Financials',
        'DE': 'Industrials',
        'GE': 'Industrials',
        'MMM': 'Industrials',
        'BA': 'Industrials',
        'SYK': 'Health Care',
        'TJX': 'Consumer Discretionary',
        'MO': 'Consumer Staples',
        'ZTS': 'Health Care',
        'ADP': 'Information Technology',
        'BKNG': 'Consumer Discretionary',
        'GILD': 'Health Care',
        'MCD': 'Consumer Discretionary',
        'SBUX': 'Consumer Discretionary',
        'C': 'Financials',
        'BDX': 'Health Care',
        'LMT': 'Industrials',
        'EOG': 'Energy',
        'MMC': 'Financials',
        'NSC': 'Industrials',
        'USB': 'Financials',
        'CSX': 'Industrials',
        'SO': 'Utilities',
        'DUK': 'Utilities',
        'PLD': 'Real Estate',
        'CCI': 'Real Estate',
        'AMT': 'Real Estate',
        'EQIX': 'Real Estate',
        'PSA': 'Real Estate',
        'WELL': 'Real Estate',
        'EXR': 'Real Estate',
        'AVB': 'Real Estate',
        'EQR': 'Real Estate',
        'VTR': 'Real Estate',
        'BXP': 'Real Estate',
        'ARE': 'Real Estate',
        'ESS': 'Real Estate',
        'MAA': 'Real Estate',
        'KIM': 'Real Estate',
        'REG': 'Real Estate',
        'HST': 'Real Estate',
        'BKH': 'Utilities',
        'ENB': 'Energy',
        'NEM': 'Materials',
        'GOLD': 'Materials',
        'VALE': 'Materials',
        'CTRA': 'Energy',
        'VICI': 'Real Estate',
        // Add Polish stocks
        'CDR': 'Materials',
        'ACP': 'Industrials',
        // Crypto
        'BTC': 'Cryptocurrency',
        'ETH': 'Cryptocurrency',
        'Bitcoin': 'Cryptocurrency',
        'Ethereum': 'Cryptocurrency'
    },

    // Display Settings
    DISPLAY: {
        DECIMAL_PLACES: {
            CURRENCY: 2,
            PERCENTAGE: 2,
            SHARES: 6,
            PRICE: 4
        },
        
        DATE_FORMAT: 'yyyy-MM-dd',
        DATETIME_FORMAT: 'yyyy-MM-dd HH:mm:ss',
        
        // Chart settings
        CHART_HEIGHT: 300,
        MOBILE_CHART_HEIGHT: 200
    },

    // Development vs Production
    ENVIRONMENT: {
        IS_DEVELOPMENT: window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1',
        DEBUG: true,
        MOCK_DATA: false
    },

    // Performance Settings
    PERFORMANCE: {
        DEBOUNCE_DELAY: 300,     // ms
        THROTTLE_DELAY: 100,     // ms
        CACHE_DURATION: 5 * 60 * 1000,  // 5 minutes
        MAX_HISTORICAL_DAYS: 1825        // 5 years
    }
};

// Export for use in other modules
window.CONFIG = CONFIG;

// Utility functions
const Utils = {
    formatCurrency: (amount, currency = 'PLN') => {
        const symbol = currency === 'PLN' ? 'zł' : '$';
        return `${symbol} ${amount.toLocaleString('pl-PL', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    },

    formatPercentage: (value) => {
        return `${value.toFixed(2)}%`;
    },

    formatNumber: (value, decimals = 2) => {
        return value.toLocaleString('pl-PL', { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
        });
    },

    parseDate: (dateString) => {
        return new Date(dateString);
    },

    formatDate: (date) => {
        return date.toISOString().split('T')[0];
    },

    // Calculate days between dates
    daysBetween: (date1, date2) => {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((date1 - date2) / oneDay));
    },

    // Get color for percentage values
    getPercentageColor: (value) => {
        if (value > 0) return CONFIG.COLORS.SUCCESS;
        if (value < 0) return CONFIG.COLORS.DANGER;
        return CONFIG.COLORS.SECONDARY;
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function  
    throttle: (func, wait) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, wait);
            }
        };
    }
};

window.Utils = Utils;