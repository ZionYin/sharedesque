import { useState, useEffect } from "react";

const useAudio = () => {
  const [audio, setAudio] = useState(null);
  const [audioStreaming, setAudioStreaming] = useState(false);

  useEffect(() => {
    if (audioStreaming) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((localAudio) => {
          setAudio(localAudio);
        });
    }
  }, [audioStreaming]);
  return [audio, audioStreaming, setAudioStreaming];
};

export default useAudio;
