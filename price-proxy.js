// Simple Node.js server to proxy price requests
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Stock prices endpoint
app.get('/api/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;
    
    try {
        // Try Yahoo Finance
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        const response = await fetch(yahooUrl);
        
        if (response.ok) {
            const data = await response.json();
            const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
            
            if (price) {
                return res.json({ price, source: 'yahoo' });
            }
        }
        
        // Try Alpha Vantage as backup
        const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=YOUR_KEY`;
        const avResponse = await fetch(avUrl);
        const avData = await avResponse.json();
        
        if (avData['Global Quote']) {
            const price = parseFloat(avData['Global Quote']['05. price']);
            return res.json({ price, source: 'alphavantage' });
        }
        
        res.status(404).json({ error: 'Price not found' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crypto prices endpoint
app.get('/api/crypto/:symbol', async (req, res) => {
    const { symbol } = req.params;
    
    try {
        const coinIds = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'DOT': 'polkadot',
            'LTC': 'litecoin'
        };
        
        const coinId = coinIds[symbol] || symbol.toLowerCase();
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const price = data[coinId]?.usd;
        if (price) {
            res.json({ price, source: 'coingecko' });
        } else {
            res.status(404).json({ error: 'Crypto price not found' });
        }
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Price proxy server running on port ${PORT}`);
});