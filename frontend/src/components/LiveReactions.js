import React from "react";
import Container from "react-bootstrap/Container";

const LiveReactions = ({ reactions }) => {
  return (
    <Container>
      {reactions.map((reaction) => (
        <div key={reaction.peerId} className="card mb-2">
          <h6>PeerId is: {reaction.peerId}:</h6>
          {reaction.emojis.map((emoji) => (
            <span key={emoji}>{emoji}</span>
          ))}
        </div>
      ))}
    </Container>
  );
};

export default LiveReactions;
