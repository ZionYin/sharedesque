import express from "express";
import rateLimit from "express-rate-limit";
import { unless } from "express-unless";
import { Server } from "socket.io";
import { pubClient, subClient, roomClient } from "./redisClients.js";
import { baseRouter } from "./routes/baseRouter.js";
import { emailRouter } from "./routes/emailRouter.js";
import { webhookRouter } from "./routes/webhookRouter.js";
import { PeerServer } from "peer";
import { createAdapter } from "@socket.io/redis-adapter";
import { webhookEmitter } from "./classes/webhookEmitter.js";
import { ValidationError } from "express-json-validator-middleware";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import webpush from "web-push";
import * as dotenv from "dotenv";

dotenv.config();
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const vapidKeys = {
  publicKey: PUBLIC_KEY,
  privateKey: PRIVATE_KEY,
};

webpush.setVapidDetails(
  "mailto:jessez.zhang@mail.utoronto.ca",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 200, // 200 req per ip per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
apiRateLimit.unless = unless;
app.use(
  apiRateLimit.unless({
    path: [`/webhooks/sendgrid/${process.env.SENDGRID_WEBHOOK_URL}`],
  })
);

const expressJson = express.json();
expressJson.unless = unless;
app.use(
  expressJson.unless({
    path: [`/webhooks/sendgrid/${process.env.SENDGRID_WEBHOOK_URL}`],
  })
);

const port = 8000;

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

let url = "https://sharedesque.xyz";
if (process.env.NODE_ENV === "development") {
  url = "*";
}
const io = new Server(server, {
  cors: {
    origin: url,
    methods: ["GET", "POST"],
  },
});

io.adapter(createAdapter(pubClient, subClient));

pubClient.on("error", (err) => {
  console.log("Redis pubclient error: " + err);
});

subClient.on("error", (err) => {
  console.log("Redis subclient error: " + err); //test1
});

app.use(
  cors({
    origin: url,
    methods: ["GET", "POST"],
  })
);

if (process.env.NODE_ENV === "development") {
  const peerServer = PeerServer({ port: 9000, path: "/peerjs/peerBroker" });
}

app.use("/", baseRouter);
app.use("/emails", emailRouter);
app.use("/webhooks", webhookRouter);

app.get("/rooms/:roomId/peerIds", async (req, res, next) => {
  const roomId = req.params.roomId;

  roomClient
    .exists(roomId)
    .then((reply) => {
      if (reply === 1) {
        roomClient.HKEYS(roomId).then((reply) => {
          return res.json({ peerIds: reply });
        });
      } else {
        return res.status(404).json({ error: "Room not found." });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: "Redis error." });
    });
});

app.get("/rooms/create", async (req, res, next) => {
  console.log("Creating room request received.");
  const roomId = uuidv4();
  roomClient
    .HSET(roomId, "", "")
    .then((reply) => {
      console.log("Room created: " + roomId);
      return res.json({ roomId: roomId });
    })
    .catch((err) => {
      console.log(err);
      console.log("Room creation failed.");
      return res.status(500).json({ error: "Redis error." });
    });
});

app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(400).send(err.validationErrors);
    next();
  } else {
    next(err);
  }
});

app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
  }
  return res.status(500).json({ error: "Internal server error" });
});

io.on("connection", (socket) => {
  console.log("a user connected");

  webhookEmitter.on("sgWebhookEvent", (event, email, webhookId) => {
    socket.to(webhookId).emit("received-sg-webhook", email, event, webhookId);
  });

  socket.on("ws-join-notif-room", (webhookId) => {
    socket.join(webhookId);
  });

  socket.on("join-room", async (ids, sub) => {
    console.log("ids.roomId: " + ids.roomId);
    console.log("ids.peerId: " + ids.peerId);

    try {
      const roomExists = await roomClient.exists(ids.roomId);
      if (roomExists !== 1) {
        socket.emit("join-room-failed", { error: "Room not found." });
        return;
      }

      const roomSize = await roomClient.HLEN(ids.roomId);
      if (roomSize >= 4) {
        socket.emit("join-room-failed", { error: "Room full." });
        return;
      }

      const reply = await roomClient.HVALS(ids.roomId);
      console.log("HVALS reply: " + reply);
      console.log("HVALS reply length: " + reply.length);

      const data = {
        type: "userJoinedRoom",
      };

      reply.forEach((subscription) => {
        console.log("subscription: " + subscription);
        if (subscription) {
          webpush
            .sendNotification(JSON.parse(subscription), JSON.stringify(data))
            .then(() => {
              console.log("Push notification sent successfully.");
            })
            .catch((error) => {
              console.log("Error sending push notification: ", error);
            });
        }
      });

      await roomClient.HSET(ids.roomId, ids.peerId, JSON.stringify(sub));
      socket.join(ids.roomId);
      socket.broadcast.to(ids.roomId).emit("user-connected", ids.peerId);
      console.log("Backend: User connected: " + ids.peerId);
    } catch (err) {
      console.log(err);
      socket.emit("join-room-failed", { error: "Redis error." });
      return;
    }

    socket.on("disconnect", () => {
      roomClient.HLEN(ids.roomId).then((reply) => {
        roomClient.HDEL(ids.roomId, ids.peerId).then((deleted) => {
          if (deleted === 1) {
            console.log(`Peer ${ids.peerId} removed from Redis`);
          } else {
            console.log(`Peer ${ids.peerId} not found in Redis`);
          }
        });

        //   if (reply <= 2) { // use redis expiry instead
        //     console.log("number of users: " + reply);
        //     roomClient.DEL(ids.roomId).then((reply) => {
        //       console.log("Room deleted: " + ids.roomId);
        //     });
        //   } else {
        //     console.log("number of users: " + reply);
        //     console.log("Room not deleted, still have people: " + ids.roomId);
        //   }
      });
      socket.emit("user-disconnected");
    });

    socket.on("reaction", (reaction) => {
      console.log("reaction: " + reaction);
      socket.broadcast.to(ids.roomId).emit("reaction", reaction);
    });
  });

  socket.on("disconnect", (ids) => {
    console.log("User has disconnected.");
  });
});
