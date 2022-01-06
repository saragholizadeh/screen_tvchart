const nodeHtmlToImage = require("node-html-to-image");
var express = require("express");
var app = express();
const ejs = require("ejs");

// set the view engine to ejs
app.set("view engine", "ejs");

const fs = require("fs");
const path = require("path");

const file = ejs.render("./index.ejs" , );

let htmlFile = fs.readFileSync(
  path.resolve(__dirname, "./index.ejs"),
  "utf8"
);

const convert = () => {
  setTimeout(() => {
     nodeHtmlToImage({
       output: "./Chart.png",
       html: htmlFile,
     }).then(() => console.log("The image was created successfully!"));
  }, 5000);
};
convert();
