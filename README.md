Screen TVChart plots a chart with your own data with resistance and support area + RSI chart + movingAverage 50,100,200 + signal postition (buy or sell). then saves this png file in server-side.

It'a a Node.js API that uses chromium and node-html-to-image package


Example : 


![Screenshot (8)](https://user-images.githubusercontent.com/78765024/161716446-adceb3ef-f1b3-431b-af16-56f8c6a6a454.png)

How it works : 

After clone the repository in your local , enter this command :

```npm install```

Then run this in project directory : 

``` node screen ```

Then open your postman and enter this url with post method :  

```
http://localhost:3002/chart
```

In body/row enter this object : (This is an example for BTC/USDT chart in timeframe 4h at exchange binance and the signal is LONG (buy))

```
{
    "symbol" : "btc",
    "pair" : "usdt",
    "timestamp" : 334234,
    "interval" : "4h",
    "exchange" : "binance",
    "type" : "resistnace",
    "side" : "long" 
}
```

After sending request,if there was no problem , The png file will saved in your computer 
