const Gun = require("gun");

const server = require("http").createServer((req, res) => {
  if (req.url.endsWith("/gun") || req.url.includes("/gun/")) {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With"
    });
  }
  res.end();
});

const gun = Gun({
  web: server,
  file: "data",
  multicast: false
});

server.listen(8765, () => {
  console.log("GUN relay peer listening on port 8765");
}); 