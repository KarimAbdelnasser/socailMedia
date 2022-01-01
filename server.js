const app = require("./app");
require("dotenv").config();

const http = require("http").Server(app);
const io = require("socket.io")(http);

io.on("connection", async (socket) => {
  socket.join(socket.handshake.query.id);

  socket.on("Not", async (data) => {
    console.log(data);
    socket.to("2").emit("notClient", data);
  });
  console.log("Hi socket");
});

const PORT = process.env.PORT || 1111;
http.listen(PORT, () => {
  console.log(`Running on port ${PORT}...`);
});
