const express = require("express");
const io = require("socket.io-client")("http://localhost:8080", {
  query: {
    id: "2",
  },
});

io.on("notClient", async (data) => {
  console.log(data);
});
const app = express();

app.listen(8090);
