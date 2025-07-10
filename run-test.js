// Simple Historical Calculation Test
// Tests the calculation logic with sample transactions

console.log('🧪 Starting Historical Portfolio Calculation Test');

// Test configuration
const CONFIG = {
    GOOGLE_SHEETS_API_KEY: 'AIzaSyCOQSG4yD4SzdrQDJH2oVJGazduyzgwq04',
    SHEET_ID: '10NuWmVJXpI1xeiiFXY5jtGHQ_SNcRbQUGS2kRyGmAKg',
    SHEET_RANGE: 'Sheet1!A1:I11' // Just first 10 transactions for test
};

// Sample test data (first few transactions)
const testTransactions = [
    { date: '2019-11-26', type: 'Buy', market: 'CRYPTO', symbol: 'Bitcoin', units: 0.15, price: 7152.61, fees: 0, currency: 'USD' },
    { date: '2019-11-26', type: 'Buy', market: 'CRYPTO', symbol: 'Ethereum', units: 2.18, price: 159.88, fees: 0, currency: 'USD' },
    { date: '2019-11-27', type: 'Buy', market: 'US', symbol: 'NEM', units: 100, price: 17.01, fees: 1, currency: 'USD' },
    { date: '2019-11-28', type: 'Buy', market: 'PL', symbol: 'CDR', units: 10, price: 145.50, fees: 0, currency: 'PLN' }
];

async function testHistoricalCalculation() {
    console.log('\n📊 Testing with sample transactions:');
    testTransactions.forEach(tx => {
        console.log(`   ${tx.date} | ${tx.type} | ${tx.symbol} | ${tx.units} units @ ${tx.price} ${tx.currency}`);
    });

    // Test 1: Historical Bitcoin price
    console.log('\n🔍 Testing historical price APIs...');
    
    try {
        // Bitcoin on Nov 26, 2019 (timestamp: 1574726400)
        const btcUrl = 'https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=1&toTs=1574726400';
        console.log('Fetching Bitcoin price for Nov 26, 2019...');
        
        const btcResponse = await fetch(btcUrl);
        const btcData = await btcResponse.json();
        
        if (btcData.Response === 'Success' && btcData.Data?.Data?.[0]) {
            const btcPrice = btcData.Data.Data[0].close;
            console.log(`✅ Bitcoin Nov 26, 2019: $${btcPrice}`);
            
            // Calculate value for our 0.15 BTC position
            const btcValue = 0.15 * btcPrice;
            console.log(`   Portfolio BTC value: $${btcValue.toFixed(2)}`);
        } else {
            console.log('❌ Bitcoin price fetch failed');
        }
    } catch (error) {
        console.log(`❌ Bitcoin test error: ${error.message}`);
    }

    // Test 2: USD/PLN exchange rate
    try {
        console.log('\nFetching USD/PLN rate for Nov 26, 2019...');
        const usdUrl = 'https://api.nbp.pl/api/exchangerates/rates/a/usd/2019-11-26/';
        
        const usdResponse = await fetch(usdUrl);
        
        if (usdResponse.ok) {
            const usdData = await usdResponse.json();
            const exchangeRate = usdData.rates[0].mid;
            console.log(`✅ USD/PLN Nov 26, 2019: ${exchangeRate}`);
        } else {
            console.log('❌ USD/PLN rate not available for this date (probably weekend)');
            // Try previous business day
            const usdUrl2 = 'https://api.nbp.pl/api/exchangerates/rates/a/usd/2019-11-25/';
            const usdResponse2 = await fetch(usdUrl2);
            if (usdResponse2.ok) {
                const usdData2 = await usdResponse2.json();
                const exchangeRate = usdData2.rates[0].mid;
                console.log(`✅ USD/PLN Nov 25, 2019 (previous business day): ${exchangeRate}`);
            }
        }
    } catch (error) {
        console.log(`❌ Exchange rate test error: ${error.message}`);
    }

    // Test 3: Calculate simple portfolio value
    console.log('\n💰 Sample portfolio calculation:');
    
    // Simulate holdings after transactions
    const holdings = new Map();
    
    // Process test transactions
    testTransactions.forEach(tx => {
        if (!holdings.has(tx.symbol)) {
            holdings.set(tx.symbol, {
                symbol: tx.symbol,
                market: tx.market,
                currency: tx.currency,
                units: 0,
                totalCost: 0
            });
        }
        
        const holding = holdings.get(tx.symbol);
        
        if (tx.type === 'Buy') {
            holding.units += tx.units;
            holding.totalCost += (tx.units * tx.price) + tx.fees;
        }
    });
    
    console.log('\nHoldings after transactions:');
    holdings.forEach(holding => {
        const avgCost = holding.totalCost / holding.units;
        console.log(`   ${holding.symbol}: ${holding.units} units @ avg cost ${avgCost.toFixed(2)} ${holding.currency}`);
    });

    // Test 4: Load real transactions from Google Sheets
    console.log('\n📋 Testing Google Sheets connection...');
    
    try {
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_RANGE}?key=${CONFIG.GOOGLE_SHEETS_API_KEY}`;
        const sheetsResponse = await fetch(sheetsUrl);
        const sheetsData = await sheetsResponse.json();
        
        if (sheetsData.values && sheetsData.values.length > 1) {
            console.log(`✅ Loaded ${sheetsData.values.length - 1} transactions from Google Sheets`);
            
            // Show first few real transactions
            console.log('\nFirst 3 real transactions:');
            for (let i = 1; i <= Math.min(3, sheetsData.values.length - 1); i++) {
                const row = sheetsData.values[i];
                console.log(`   ${row[0]} | ${row[1]} | ${row[3]} | ${row[4]} units`);
            }
        } else {
            console.log('❌ Google Sheets loading failed');
        }
    } catch (error) {
        console.log(`❌ Sheets test error: ${error.message}`);
    }

    console.log('\n🎯 Historical calculation test complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create Google Sheets HistoricalData tab');
    console.log('   2. Build full historical calculation system');
    console.log('   3. Calculate daily portfolio values from 2019 to present');
    console.log('   4. Restore charts with real historical data');
}

// Run the test
testHistoricalCalculation().catch(error => {
    console.error('Test failed:', error);
});