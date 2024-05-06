import { io } from "socket.io-client";
// import dotenv from 'dotenv';
// const env = dotenv.config().parsed;
// const URL = env.REACT_APP_SERVER_URL;
let socketUrl = "https://api.sharedesque.xyz";
if (process.env.NODE_ENV === "development") {
  socketUrl = "http://localhost:8000";
}
// const URL = "https://api.sharedesque.xyz";

export const socket = io(socketUrl, {
  autoConnect: false,
});
