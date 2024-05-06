import { useState, useEffect } from "react";
import Peer from "peerjs";

const usePeer = () => {
  let peerOptions = {
    host: "peerjs.sharedesque.xyz",
    path: "/",
    proxied: true,
  };

  if (process.env.NODE_ENV === "development") {
    peerOptions = {
      host: "localhost",
      port: 9000,
      path: "/peerjs/peerBroker",
    };
  }

  const [peer] = useState(new Peer(peerOptions));

  const [peerId, setPeerId] = useState(null);

  useEffect(() => {
    peer.on("open", () => {
      setPeerId(peer.id);
    });
  }, []);

  return [peer, peerId];
};

export default usePeer;
