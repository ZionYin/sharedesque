import { useState, useEffect } from "react";

const useStream = () => {
  const [stream, setStream] = useState(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (streaming) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then((localStream) => {
          setStream(localStream);
        });
    }
  }, [streaming]);
  return [stream, streaming, setStreaming];
};

export default useStream;
