# Elite Portfolio Analytics Platform

A professional-grade portfolio tracker with advanced analytics, risk management, and tax optimization designed for Polish investors trading US stocks, PL stocks, crypto, and physical assets.

## 🚀 Live Demo

Access the live application at: [GitHub Pages URL will be here after deployment]

## ✨ Features

- **Real-time Portfolio Analytics** with advanced risk metrics
- **FIFO Cost Basis Calculation** (Polish tax law compliant)
- **Multi-Market Support**: US stocks, Polish stocks, Crypto, Physical assets
- **Real-time Price Fetching** from Yahoo Finance, CoinGecko, NBP APIs
- **Tax Optimization** for Polish investors
- **Interactive Charts** with professional visualizations
- **Mobile-Responsive Design**

## 📊 Supported Assets

- **US Stocks**: Real-time prices via Yahoo Finance API
- **Polish Stocks**: Including NewConnect (PLI at 13.4 PLN)
- **Cryptocurrencies**: BTC, ETH, DOT, LTC via CoinGecko API
- **Physical Assets**: Silver, Gold prices
- **Multi-currency**: USD/PLN with NBP exchange rates

## 🛠️ Setup

1. **Data Source**: Connect your Google Sheets with transaction data
2. **API Keys**: The app uses free APIs (no keys required for basic usage)
3. **Deploy**: Works on GitHub Pages for CORS-free API access

## 📈 Transaction Format

Your Google Sheet should have columns:
- Date (yyyy-mm-dd)
- Type (Buy/Sell/Div/CapReduct/Split)
- Market (US/PL/CRYPTO/PHYSICAL)
- Symbol (AAPL, CDR, BTC, etc.)
- Units
- TX Price
- Fees
- Split (1.0 by default)
- Currency (USD/PLN)

## 🔧 Technical Stack

- **Frontend**: Vanilla JavaScript, Chart.js, Tailwind CSS
- **APIs**: Yahoo Finance, CoinGecko, NBP, Google Sheets
- **Deployment**: GitHub Pages
- **Analytics**: Advanced financial calculations with FIFO cost basis

## 📱 Mobile Support

Fully responsive design optimized for mobile portfolio monitoring.

---

**Note**: This is a free, open-source alternative to expensive portfolio management software, specifically optimized for Polish tax law and multi-market investing.