import React, { useRef, useEffect } from "react";
import Container from "react-bootstrap/esm/Container";

function Video({ stream }) {
  const videoRef = useRef(null);
  const vidStyle = {
    width: "100%",
    height: "100%",
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <>
      <video style={vidStyle} ref={videoRef} autoPlay playsInline />
    </>
  );
}

export default Video;
