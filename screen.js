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
  const newSymbol = symbol.replace("/", "").toUpperCase();
  const data = await axios
    .get(`https://api.binance.com/api/v3/exchangeInfo?symbol=${newSymbol}`)
    .catch((err) => console.log(err));
  const filters = data.data.symbols[0].filters;
  const tick = filters[0].tickSize; // tick size
  const precisionT = precision(tick); // precision of tick size
  const obj = { tick, precisionT };
  return obj;
};

//kucoin ticksize
const kucoinTickSize = async (symbol) => {
  const symbolData = await axios
    .get("https://api.kucoin.com/api/v1/symbols")
    .catch((err) => console.log(err));
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
};

const kucoinCandles = async (symbol, interval) => {
    const candles = await axios(
      `https://api.kucoin.com/api/v1/market/candles?type=${interval}&symbol=${symbol}`
    );
    var data = candles.data.data;
    return data;
};

const binanceCandles = async (symbol, interval) => {
  const candles = await axios(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
  ).catch((err) => console.log(err));
  console.log({candles})
  var data = candles.data;
  return data;
};

//Convert html to png file
const convert = async ({symbol,pair,exchange,interval,from,value1,value2,imageName}) => {
  let htmlFile = fs.readFileSync(
    path.resolve(__dirname, "./chart.html"),
    "utf8"
  );

  //Precision and ticke size
  var prec = 0;
  var tick = 0;

  //Symbol format (Binance = BTCUSDT || kucoin = BTC-USDT)
  var finalSymbol = "";
  var api ;

  if (exchange == "KUCOIN") {
    const prom = await new Promise(async(resolve , reject)=>{
      setTimeout(async()=>{
        finalSymbol = `${symbol}-${pair}`
        var kuc = await kucoinTickSize(finalSymbol).catch(err=>console.log(err));
        prec += kuc.precLimit;
        tick += kuc.limit;
        api = await kucoinCandles(finalSymbol , interval);
        resolve()
      } , 5000)
    })
    
  } else if (exchange == "BINANCE") {
    finalSymbol = `${symbol}${pair}`
    var bin = await tickSize(finalSymbol).catch((err) => console.log(err));
    prec += bin.precisionT;
    tick += bin.tick;
    tick = parseFloat(tick);
    api = await binanceCandles(finalSymbol , interval);
  }

  console.log(api)
  //Get symbol with binance symbols format for store image
  var imageSymbol = `${symbol}${pair}`;

  const newPromise = await new Promise((resolve, reject) => {
    nodeHtmlToImage({
      output: `./home/standbuy/python/csv/trendline_figs/${imageName}.png`,
      html: htmlFile,
      content: {
        symbol: finalSymbol,
        tick: tick,
        precision: prec,
        exchange : exchange,
        interval: interval,
        from: from,
        value1: value1,
        value2 : value2,
        api : api
      },
      puppeteerArgs : {args : ['no-sandbox'] }
    }).then(()=> {
      resolve();
    });
  })
};

//Create chart.png request
app.post("/chart", async (req, res) => {
  const symbol = req.body.symbol;
  const pair = req.body.pair;
  const exchange = req.body.exchange;
  const time = req.body.time;
  const values = req.body.values;
  const timestamp = req.body.timestamp;
  const type = req.body.type;
  var interval = req.body.interval;

  const imageSymbol = `${symbol.toUpperCase()}${pair.toUpperCase()}`;
  const imageName = `${imageSymbol}_${interval.toUpperCase()}_${timestamp}_${type.toUpperCase()}`;

  const kucoinTimestamps = {
    "1m" : "1min",
    "5m" : "3min",
    "15m" : "15min",
    "1h" :"1hour",
    "4h" : "4hour",
    "1d" : "1day",
    "1w" :"1week"
  }

  var realInterval;
  if(exchange == "kucoin"){
    realInterval = kucoinTimestamps[interval.toLowerCase()]
  }else {
    realInterval = interval
  }

  const content = {
    symbol: symbol.toUpperCase(),
    pair : pair.toUpperCase(),
    exchange: exchange.toUpperCase(),
    interval: realInterval.toLowerCase(),
    from: time,
    value1: values[0],
    value2 : values[1],
    imageName : imageName
  };


  var a = await convert(content);
  console.log(imageName)
  res.send(imageName)
});

const port = 3002 || process.env.PORT;

const httpsServer = http.createServer(app);
httpsServer.listen(port);
