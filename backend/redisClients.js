import { createClient } from "redis";

let redisOptions = {
  url: "redis://redis:6379",
};
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
  redisOptions = {
    host: "localhost",
    port: 6379,
  };
}

export const pubClient = createClient(redisOptions);
export const subClient = pubClient.duplicate();
export const roomClient = pubClient.duplicate();

pubClient.on("error", (err) => {
  console.log("Redis pubClient error: " + err);
});

subClient.on("error", (err) => {
  console.log("Redis subClient error: " + err);
});

roomClient.on("error", (err) => {
  console.log("Redis roomClient error: " + err);
});

await pubClient.connect();
await subClient.connect();
await roomClient.connect();
