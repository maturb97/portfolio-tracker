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
            // Cryptocurrency prices via CryptoCompare
            const cryptoSymbols = {
                'Bitcoin': 'BTC', 'BTC': 'BTC',
                'Ethereum': 'ETH', 'ETH': 'ETH',
                'DOT': 'DOT', 'LTC': 'LTC'
            };
            
            const cryptoSymbol = cryptoSymbols[symbol] || symbol.toUpperCase();
            
            try {
                // Try CryptoCompare first
                const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${cryptoSymbol}&tsyms=USD`);
                const data = await response.json();
                
                if (data.USD && data.USD > 0) {
                    price = data.USD;
                    source = 'cryptocompare';
                    console.log(`✅ Fetched crypto ${symbol}: $${price}`);
                } else {
                    throw new Error('No USD price in CryptoCompare response');
                }
            } catch (error) {
                console.error(`CryptoCompare failed for ${symbol}:`, error.message);
                
                // Fallback to CoinGecko (current prices only)
                try {
                    const coinIds = {
                        'BTC': 'bitcoin', 'ETH': 'ethereum', 
                        'DOT': 'polkadot', 'LTC': 'litecoin'
                    };
                    const coinId = coinIds[cryptoSymbol];
                    
                    if (coinId) {
                        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
                        const data = await response.json();
                        price = data[coinId]?.usd;
                        source = 'coingecko-fallback';
                        
                        if (price) {
                            console.log(`✅ Fetched crypto ${symbol} via fallback: $${price}`);
                        }
                    }
                } catch (fallbackError) {
                    console.error(`CoinGecko fallback failed for ${symbol}:`, fallbackError.message);
                }
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
                    // PLI from MarketWatch scraping
                    try {
                        const marketwatchUrl = 'https://www.marketwatch.com/investing/stock/pli?countrycode=pl';
                        const response = await fetch(marketwatchUrl);
                        const html = await response.text();
                        
                        // Extract price using regex to find the bg-quote element
                        const priceMatch = html.match(/<bg-quote[^>]*>([0-9.,]+)</);
                        if (priceMatch && priceMatch[1]) {
                            price = parseFloat(priceMatch[1].replace(',', '.'));
                            source = 'marketwatch-pli';
                            console.log(`✅ Fetched PLI from MarketWatch: ${price} PLN`);
                        } else {
                            throw new Error('Price not found in MarketWatch HTML');
                        }
                    } catch (error) {
                        console.error(`MarketWatch PLI fetch failed:`, error.message);
                        // Fallback to manual price
                        price = 13.4;
                        source = 'fallback-pli';
                    }
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