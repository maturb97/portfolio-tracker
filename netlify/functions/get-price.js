// Netlify serverless function for price fetching
exports.handler = async (event, context) => {
    const { symbol, type } = event.queryStringParameters;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        let price;
        
        if (type === 'crypto') {
            // Fetch crypto price from CoinGecko
            const coinIds = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum', 
                'DOT': 'polkadot',
                'LTC': 'litecoin'
            };
            
            const coinId = coinIds[symbol];
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const data = await response.json();
            price = data[coinId]?.usd;
            
        } else {
            // Fetch stock price from Yahoo Finance
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
            const data = await response.json();
            price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        }
        
        if (price) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ price, symbol, timestamp: Date.now() })
            };
        } else {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Price not found' })
            };
        }
        
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};