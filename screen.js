const nodeHtmlToImage = require("node-html-to-image");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const express = require("express");
const app = express();
const http = require("http");
app.use(express.json());

const precision = (a) => {
  if (typeof a !== "number") {
    a = parseFloat(a);
  }
  if (!isFinite(a)) return 0;
  var e = 1,
    p = 0;
  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }
  return p;
};

//Binance tick size
const tickSize = async (symbol) => {
  try {
    const newSymbol = symbol.replace("/", "").toUpperCase();
    const data = await axios.get(`https://api.binance.com/api/v3/exchangeInfo?symbol=${newSymbol}`);
    const filters = data.data.symbols[0].filters;
    const tick = filters[0].tickSize; // tick size
    const precisionT = precision(tick); // precision of tick size
    const obj = { tick, precisionT };
    return obj;
  } catch (e) {
    return false;
  }
};

//kucoin ticksize
const kucoinTickSize = async (symbol) => {
  try {
    const symbolData = await axios.get("https://api.kucoin.com/api/v1/symbols");
    const dataArray = symbolData.data.data;

    const limitObj = {};
    for (let i = 0; i < dataArray.length; i++) {
      const element = dataArray[i];
      const currSymbol = element.symbol,
        priceIncrement = element.priceIncrement;
      limitObj[currSymbol] = { priceIncrement };
    }

    var limit = Object.values(limitObj[`${symbol}`]);
    limit = parseFloat(limit[0]);
    precLimit = precision(limit);

    const obj = { limit, precLimit };
    return obj;
  } catch (e) {
    return false;
  }
};

const kucoinCandles = async (symbol, interval) => {
  try {
    const candles = await axios.get(`https://api.kucoin.com/api/v1/market/candles?type=${interval.toLowerCase()}&symbol=${symbol}&startedAt=${current}`);
    var data = candles["data"]["data"];
    return data;
  } catch (e) {
    return false;
  }
};

const binanceCandles = async (symbol, interval) => {
  try {
    const candles = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval.toLowerCase()}&limit=500`);
    var data = candles["data"];
    return data;
  } catch (e) {
    return false;
  }
};

//Convert html to png file
const convert = async ({symbol, pair, exchange, interval , type , timestamp , side}) => {
  let htmlFile = fs.readFileSync(path.resolve(__dirname, "./chart.html"), "utf8");

  //Precision and ticke size
  var prec = 0;
  var tick = 0;

  //Symbol format (Binance = BTCUSDT || kucoin = BTC-USDT)
  var finalSymbol = "";
  var api;

  if (exchange.toUpperCase() == "KUCOIN") {
    finalSymbol = `${symbol}-${pair}`;
    var kuc = await kucoinTickSize(finalSymbol);
    if (kuc == false) {
    prec += 4;
    tick += 0.0001;
    } else {
    prec += kuc["precLimit"];
    tick += kuc["limit"];
    }
    api = await kucoinCandles(finalSymbol, interval);
    if (api == false) {
    return false;
    }
  } else if (exchange.toUpperCase() == "BINANCE") {
    finalSymbol = `${symbol}${pair}`;
    var bin = await tickSize(finalSymbol);
    if (kuc == false) {
      prec += 4;
      tick += 0.0001;
    } else {
      prec += bin["precisionT"];
      tick += bin["tick"];
    }

    tick = parseFloat(tick);
    api = await binanceCandles(finalSymbol, interval);
    if (api == false) {
      return false;
    }
  }
  //Get symbol with binance symbols format for store image
  var imageSymbol = `${symbol}${pair}`;

  const newPromise = await new Promise((resolve, reject) => {
    nodeHtmlToImage({
      output: `/home/standbuy/python/csv/trendline_figs/${imageSymbol}_${interval.toUpperCase()}_${timestamp}_${type}.png`,

      html: htmlFile,
      content: {
        symbol: finalSymbol,
        tick: tick,
        precision: prec,
        exchange: exchange,
        interval: interval,
        api: api,
        side : side
      },
      puppeteerArgs: { args: ["--no-sandbox"] },
    }).then(() => {
      resolve();
    });
  });
};

//Create chart.png request
app.post("/chart", async (req, res) => {
  const symbol = req.body.symbol;
  const pair = req.body.pair;
  const exchange = req.body.exchange;
  const side = req.body.side;
  const type = req.body.type;
  const timestamp = req.body.timestamp;
  var interval = req.body.interval;

  const kucoinTimestamps = {
    "1m": "1min",
    "5m": "3min",
    "15m": "15min",
    "1h": "1hour",
    "4h": "4hour",
    "1d": "1day",
    "1w": "1week",
  };

  var realInterval;
  if (exchange.toLowerCase() == "kucoin") {
    realInterval = kucoinTimestamps[interval.toLowerCase()];
  } else {
    realInterval = interval;
  }

  const content = {
    symbol: symbol.toUpperCase(),
    pair: pair.toUpperCase(),
    exchange: exchange.toUpperCase(),
    interval: realInterval,
    type : type ,
    timestamp : timestamp,
    side : side
  };

  
  var imageSymbol = `${symbol.toUpperCase()}${pair.toUpperCase()}`;

  convert(content)
    .then((result) => {
      if (result != false) {
        res.send({address: `${imageSymbol}_${realInterval.toUpperCase()}_${timestamp}_${type.toUpperCase()}.png`,});
      } else {
        res.send({ address: "" });
      }
    })
    .catch((e) => {
      res.send({ address: "" });
    });
});

const port = 3002 || process.env.PORT;

const httpsServer = http.createServer(app);
httpsServer.listen(port);

