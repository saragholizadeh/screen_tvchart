const nodeHtmlToImage = require("node-html-to-image");
const fs = require("fs");
const path = require("path");

let htmlFile = fs.readFileSync(path.resolve(__dirname, "./chart.html"), "utf8");

const convert = () => {
  setTimeout(() => {
    nodeHtmlToImage({
      output: "./Chart.png",
      html: htmlFile,
      content: {
        symbol: "BTCUSDT",
        interval: "4h",
        tl: {
          time1: 1641558829,
          time2: 1641126829,
          value1: 41800,
          value2: 45000,
        },
        rsi :{
          lables : [1500, 1560, 1590, 1610, 1660 , 1680 ,1700],
          data :  [1 , 7 , 8 , 16 , 18 , 20 , 21.5]
        }
      },
    }).then(() => console.log("The image was created successfully!"));
  }, 3000);
};


convert();
