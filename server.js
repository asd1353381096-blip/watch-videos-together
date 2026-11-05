const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 房间管理
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('有人连接：', socket.id);

  // 创建/加入房间
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { host: socket.id, videoHash: null });
    }
    socket.to(roomId).emit('userJoin', socket.id);
    console.log(`${socket.id} 加入房间 ${roomId}`);
  });

  // 同步播放暂停
  socket.on('playState', (data) => {
    socket.to(data.roomId).emit('playState', data);
  });

  // 同步跳转进度
  socket.on('seek', (data) => {
    socket.to(data.roomId).emit('seek', data);
  });

  // 上报视频哈希校验
  socket.on('setVideoHash', (data) => {
    const room = rooms.get(data.roomId);
    if (room) {
      room.videoHash = data.hash;
    }
    socket.to(data.roomId).emit('checkHash', data.hash);
  });

  // 聊天消息
  socket.on('chatMsg', (data) => {
    socket.to(data.roomId).emit('chatMsg', data);
  });

  socket.on('disconnect', () => {
    console.log('断开连接：', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务运行在端口 ${PORT}`);
});
