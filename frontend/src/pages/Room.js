import React, { useEffect, useState, useReducer } from "react";
import { useNavigate } from "react-router-dom";

import { useParams } from "react-router-dom";
import { socket } from "../socket";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Video from "../components/Video";
import SendInviteModal from "../components/SendInviteModal";
import LiveReactions from "../components/LiveReactions";

import { apiService } from "../services/apiService";
import useStream from "../hooks/useStream";
import useAudio from "../hooks/useAudio";
import usePeer from "../hooks/usePeer";

import styled from "styled-components";

export default function Room() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [outStream, sendingStream, setSendingStream] = useStream();
  const [outAudio, sendingAudio, setSendingAudio] = useAudio();
  const [peer, peerId] = usePeer();

  const [peerList, setPeerList] = useState([]);

  const [inStreams, setinStreams] = useState([]);
  const [activeOutCalls, setActiveOutCalls] = useState([]);

  const [inAudios, setinAudios] = useState([]);
  const [activeOutAudioCalls, setActiveOutAudioCalls] = useState([]);

  const [reactions, setReactions] = useState([]);
  const [selectedEmojis, setSelectedEmojis] = useState([]);

  useEffect(() => {
    socket.on("reaction", (reaction) => {
      console.log("reaction received");
      // replace reaction if it already exists
      const newReactions = reactions.filter(
        (r) => r.peerId !== reaction.peerId
      );
      newReactions.push(reaction);
      setReactions(newReactions);
    });

    return () => {
      socket.off("reaction");
    };
  }, [reactions]);

  useEffect(() => {
    socket.emit("reaction", {
      peerId: peerId,
      emojis: selectedEmojis,
    });
  }, [selectedEmojis]);

  // need peerId before you can do anything else
  useEffect(() => {
    console.log("frontend: " + process.env.NODE_ENV);
    if (!peerId) {
      return;
    }
    // connect to the socket and join the room
    socket.connect();
    const pushSub = JSON.parse(localStorage.getItem("pushSub"));
    socket.emit("join-room", { roomId: roomId, peerId: peerId }, pushSub);

    // log error
    socket.on("join-room-failed", (err) => {
      alert(`Room join failed! Reason: ${err.error}`);
      navigate("/");
      console.log("Room join failed");
    });

    // get info of other people in room in case you need to call
    apiService.getRoomPeerIds(roomId).then((roomPeerIds) => {
      roomPeerIds?.peerIds.forEach((peerId) => {
        setPeerList((prevState) => [...prevState, peerId]);
      });
    });

    // when someone connects, add to peer list
    socket.on("user-connected", (id) => {
      setPeerList((prevState) => [...prevState, id]);
    });

    peer.on("call", (call) => {
      // don't answer with a stream. all calls are one-sided
      call.answer();
      // received calls get added to the list of received streams
      call.on("stream", (stream) => {
        setinStreams((prevState) => [
          ...prevState,
          { stream: stream, id: call.peer },
        ]);
      });
    });

    return () => {
      socket.off("join-room-failed");
      socket.off("user-connected");
      socket.disconnect();
      peer.off("open");
      peer.off("call");
      peer.disconnect();
    };
  }, [peerId]);

  // calls all other peers. tries again whenever peerList is updated.
  useEffect(() => {
    if (sendingStream && outStream) {
      if (inStreams.filter((inStream) => inStream.id == "me").length == 0) {
        setinStreams((prevState) => [
          ...prevState,
          { stream: outStream, id: "me" },
        ]);
      }
      peerList.forEach((otherPeer) => {
        if (
          otherPeer &&
          otherPeer !== peerId &&
          !activeOutCalls.includes(otherPeer)
        ) {
          setActiveOutCalls([...activeOutCalls, otherPeer]);
          peer.call(otherPeer, outStream);
        }
      });
    }
  }, [sendingStream, outStream, peerList]);

  // calls all other peers. tries again whenever peerList is updated.
  useEffect(() => {
    if (sendingAudio && outAudio) {
      if (inAudios.filter((inAudio) => inAudio.id == "me").length == 0) {
        setinAudios((prevState) => [
          ...prevState,
          { audio: outAudio, id: "me" },
        ]);
      }
      peerList.forEach((otherPeer) => {
        if (
          otherPeer &&
          otherPeer !== peerId &&
          !activeOutAudioCalls.includes(otherPeer)
        ) {
          setActiveOutAudioCalls([...activeOutAudioCalls, otherPeer]);
          peer.call(otherPeer, outAudio);
        }
      });
    }
  }, [sendingAudio, outAudio, peerList]);

  // starts sharing stream. gets room inhabitants from api.
  function sendStream() {
    setSendingStream(true);
  }

  // starts sharing audio. gets room inhabitants from api.
  function sendAudio() {
    setSendingAudio(true);
  }

  const allEmojis = ["👍", "👎", "😀", "😂", "❤️", "🔥", "🚀", "👀", "🤔"];

  function handleEmojiClick(emoji) {
    if (selectedEmojis.includes(emoji)) {
      setSelectedEmojis(selectedEmojis.filter((e) => e !== emoji));
    } else {
      setSelectedEmojis([...selectedEmojis, emoji]);
    }
  }

  return (
    <Container fluid className="vh-100">
      <Row className="vh-100">
        <Col className="border h-100 bg-dark" sm={11}>
          {inStreams &&
            inStreams.map((stream) => (
              <Video key={stream.id} stream={stream.stream} />
            ))}
        </Col>
        <Col className="border" sm={1}>
          <div className="d-flex flex-column">
            <button className="btn btn-primary mb-2" onClick={sendStream}>
              Send Stream
            </button>
            <button className="btn btn-primary mb-2" onClick={sendAudio}>
              Enable Voice
            </button>
            <SendInviteModal roomId={roomId} />
            <Container className="d-flex flex-column">
              {allEmojis.map((emoji) => (
                <EmojiButton
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className={selectedEmojis.includes(emoji) ? "selected" : ""}
                >
                  {emoji}
                </EmojiButton>
              ))}
            </Container>
            <LiveReactions reactions={reactions} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

const EmojiButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  border-radius: 5px;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #f9f9f9;
  }

  &.selected {
    background: yellow;
    box-shadow: 0px 0px 10px rgba(255, 255, 0, 0.5);
  }
`;
