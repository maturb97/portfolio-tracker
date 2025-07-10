const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const { symbol, type, market } = event.queryStringParameters;
        
        if (!symbol) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Symbol parameter required' })
            };
        }
        
        let price = null;
        let source = 'unknown';
        
        // Handle different asset types
        if (type === 'crypto' || market === 'CRYPTO') {
            // Cryptocurrency prices
            const coinIds = {
                'Bitcoin': 'bitcoin',
                'BTC': 'bitcoin',
                'Ethereum': 'ethereum', 
                'ETH': 'ethereum',
                'DOT': 'polkadot',
                'LTC': 'litecoin'
            };
            
            const coinId = coinIds[symbol] || symbol.toLowerCase();
            
            try {
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
                const data = await response.json();
                price = data[coinId]?.usd;
                source = 'coingecko';
                
                if (price) {
                    console.log(`✅ Fetched crypto ${symbol}: $${price}`);
                }
            } catch (error) {
                console.error(`CoinGecko failed for ${symbol}:`, error.message);
            }
            
        } else if (type === 'commodity' || market === 'PHYSICAL') {
            // Commodity prices
            if (symbol.toLowerCase().includes('silver')) {
                try {
                    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=silver&vs_currencies=usd');
                    const data = await response.json();
                    price = data.silver?.usd;
                    source = 'coingecko-silver';
                } catch (error) {
                    console.error(`Silver price fetch failed:`, error.message);
                }
            } else if (symbol.toLowerCase().includes('gold')) {
                // Try metals API for gold
                try {
                    const response = await fetch('https://api.metals.live/v1/spot/gold');
                    const data = await response.json();
                    price = data.price;
                    source = 'metals-api';
                } catch (error) {
                    console.error(`Gold price fetch failed:`, error.message);
                }
            }
            
        } else {
            // Stock prices
            
            // Handle Polish stocks
            if (market === 'PL' || ['CDR', 'ACP', 'PLI'].includes(symbol)) {
                if (symbol === 'PLI') {
                    // PLI is on NewConnect - manual price
                    price = 13.4;
                    source = 'manual-newconnect';
                } else {
                    // Try Yahoo Finance with Warsaw suffix
                    const polishSymbol = symbol + '.WA';
                    try {
                        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${polishSymbol}`);
                        const data = await response.json();
                        price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                        source = 'yahoo-warsaw';
                        
                        if (price) {
                            console.log(`✅ Fetched Polish stock ${symbol}: ${price} PLN`);
                        }
                    } catch (error) {
                        console.error(`Polish stock fetch failed for ${symbol}:`, error.message);
                        // Fallback for Polish stocks
                        const fallback = { 'CDR': 140.00, 'ACP': 165.00 };
                        price = fallback[symbol];
                        source = 'fallback-polish';
                    }
                }
            } else {
                // US and international stocks
                try {
                    // Try Yahoo Finance first
                    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
                    const data = await response.json();
                    price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                    source = 'yahoo-finance';
                    
                    if (price) {
                        console.log(`✅ Fetched stock ${symbol}: $${price}`);
                    }
                } catch (error) {
                    console.error(`Yahoo Finance failed for ${symbol}:`, error.message);
                    
                    // Try Alpha Vantage as backup
                    try {
                        const avKey = 'demo'; // Replace with real key if needed
                        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${avKey}`);
                        const data = await response.json();
                        
                        if (data['Global Quote'] && data['Global Quote']['05. price']) {
                            price = parseFloat(data['Global Quote']['05. price']);
                            source = 'alphavantage';
                            console.log(`✅ Fetched ${symbol} from Alpha Vantage: $${price}`);
                        }
                    } catch (avError) {
                        console.error(`Alpha Vantage failed for ${symbol}:`, avError.message);
                    }
                }
            }
        }
        
        if (price && price > 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    price, 
                    symbol, 
                    source,
                    timestamp: Date.now(),
                    currency: market === 'PL' ? 'PLN' : 'USD'
                })
            };
        } else {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ 
                    error: `Price not found for ${symbol}`,
                    symbol,
                    timestamp: Date.now()
                })
            };
        }
        
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message,
                timestamp: Date.now()
            })
        };
    }
};