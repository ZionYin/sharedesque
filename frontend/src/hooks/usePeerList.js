import { useState, useEffect } from "react";

const usePeerList = () => {
  const [peerList, setPeerList] = useState([]);

  function addPeer(peerId) {
    setPeerList(peerList.concat([peerId]));
  }

  return [peerList, addPeer];
};

export default usePeerList;
