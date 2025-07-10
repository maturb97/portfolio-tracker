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
            // Commodity prices with fallbacks
            const commodityFallbacks = {
                'SILVER': 31.25,  // Silver price per oz
                'Silver': 31.25,
                'GOLD': 2650.00,  // Gold price per oz
                'Gold': 2650.00
            };
            
            if (symbol.toLowerCase().includes('silver')) {
                try {
                    // Try metals API first for silver
                    const response = await fetch('https://api.metals.live/v1/spot/silver');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.price && data.price > 0 && data.price < 1000) {
                            price = data.price;
                            source = 'metals-api-silver';
                            console.log(`✅ Fetched silver from metals API: $${price}`);
                        } else {
                            throw new Error('Invalid silver price from metals API');
                        }
                    } else {
                        throw new Error('Metals API not available');
                    }
                } catch (error) {
                    console.error(`Silver price fetch failed:`, error.message);
                    // Use fallback price
                    price = commodityFallbacks.SILVER;
                    source = 'fallback-silver';
                    console.log(`🔧 Using fallback silver price: $${price}`);
                }
            } else if (symbol.toLowerCase().includes('gold')) {
                try {
                    // Try metals API for gold
                    const response = await fetch('https://api.metals.live/v1/spot/gold');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.price && data.price > 0) {
                            price = data.price;
                            source = 'metals-api-gold';
                            console.log(`✅ Fetched gold from metals API: $${price}`);
                        } else {
                            throw new Error('Invalid gold price from metals API');
                        }
                    } else {
                        throw new Error('Metals API not available');
                    }
                } catch (error) {
                    console.error(`Gold price fetch failed:`, error.message);
                    // Use fallback price
                    price = commodityFallbacks.GOLD;
                    source = 'fallback-gold';
                    console.log(`🔧 Using fallback gold price: $${price}`);
                }
            }
            
        } else {
            // Stock prices
            
            // Handle known problematic symbols
            const stockFallbacks = {
                'BATS': 35.50,  // British American Tobacco fallback
                'CNR': 165.00,  // Canadian National Railway
                'CDR': 140.00,  // Polish stock fallback
                'ACP': 165.00   // Polish stock fallback
            };
            
            // Handle Polish stocks
            if (market === 'PL' || ['CDR', 'ACP', 'PLI', 'XTB', 'GPW', 'BBT', 'STX', 'ASB', 'PCR'].includes(symbol)) {
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
                        // Use fallback if available
                        price = stockFallbacks[symbol];
                        source = 'fallback-polish';
                    }
                }
            } else {
                // US and international stocks
                try {
                    // Try Yahoo Finance first
                    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
                    const data = await response.json();
                    
                    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
                        price = data.chart.result[0].meta.regularMarketPrice;
                        source = 'yahoo-finance';
                        console.log(`✅ Fetched stock ${symbol}: $${price}`);
                    } else {
                        throw new Error('No price in Yahoo response');
                    }
                } catch (error) {
                    console.error(`Yahoo Finance failed for ${symbol}:`, error.message);
                    
                    // Use fallback if available
                    if (stockFallbacks[symbol]) {
                        price = stockFallbacks[symbol];
                        source = 'fallback-manual';
                        console.log(`🔧 Using fallback price for ${symbol}: $${price}`);
                    } else {
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