const log = console.log;

const chartProperties = {
  width:1900,
  height:700,
  timeScale:{
    timeVisible:true,
    secondsVisible:false,
  }
}

const domElement = document.getElementById('tvchart');
const chart = LightweightCharts.createChart(domElement,chartProperties);
const candleSeries = chart.addCandlestickSeries();

var series2 = chart.addLineSeries({
  color: "rgb(45, 120, 255)",
  lineWidth: 2,
});

var timestamp1 = 1641268649;
var timestamp2 = 1641368649;

var data2 = [
  { time: timestamp1 , value: 46555 },
  { time: timestamp2 , value: 46169 },
];

series2.setData(data2);

fetch(`http://127.0.0.1:9665/fetchAPI?endpoint=https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1000`)
  .then(res => res.json())
  .then(data => {
    const cdata = data.map(d => {
      return {time:d[0]/1000,open:parseFloat(d[1]),high:parseFloat(d[2]),low:parseFloat(d[3]),close:parseFloat(d[4])}
    });
    candleSeries.setData(cdata);
  }).catch(err => log(err))

//Dynamic Chart
const socket = io.connect('http://127.0.0.1:4000/');

socket.on('KLINE',(pl)=>{
  //log(pl);
  candleSeries.update(pl);
});
