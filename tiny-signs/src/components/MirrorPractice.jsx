import { useEffect, useRef, useState } from "react";

export default function MirrorPractice({ sign }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(0);
  const [status, setStatus] = useState("closed");

  const stopCamera = () => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("closed");
  };

  useEffect(() => () => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setStatus("requesting");
    let timeoutId;
    let timedOut = false;

    try {
      const cameraRequest = navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      cameraRequest.then((lateStream) => {
        if (timedOut || requestRef.current !== requestId) lateStream.getTracks().forEach((track) => track.stop());
      }).catch(() => {});
      const timeout = new Promise((resolve, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true;
          reject(new Error("camera-permission-timeout"));
        }, 6000);
      });
      const stream = await Promise.race([cameraRequest, timeout]);
      window.clearTimeout(timeoutId);
      if (requestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("open");
    } catch (error) {
      window.clearTimeout(timeoutId);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      console.info("Tiny Signs camera was not opened.", error?.name || error);
      setStatus("denied");
    }
  };

  return (
    <section className="mirror-card card">
      <div className="mirror-intro">
        <div>
          <p className="eyebrow">Optional mirror</p>
          <h2>Compare your hands</h2>
          <p>Open your front camera, make {sign.word}, and compare the four checks above. Nothing is recorded, saved, uploaded, or graded.</p>
        </div>
        {status === "closed" && <button type="button" className="button secondary" onClick={openCamera}>Open my mirror</button>}
      </div>

      {status === "requesting" && <p className="camera-status" role="status">Waiting for camera permission…</p>}

      {(status === "denied" || status === "unavailable") && (
        <div className="camera-fallback" role="status">
          <strong>The camera is optional.</strong>
          <p>Use a household mirror and the four checks above. You can learn every sign without camera access.</p>
          {status === "denied" && <button type="button" className="text-button" onClick={openCamera}>Try again</button>}
        </div>
      )}

      <div className={`mirror-view ${status === "open" ? "visible" : ""}`} hidden={status !== "open"}>
        <div className="camera-wrap">
          <video ref={videoRef} muted playsInline aria-label="Live mirrored camera view" />
          <span aria-hidden="true">your mirror</span>
        </div>
        <div className="mirror-copy">
          <p className="eyebrow">Compare, don’t score</p>
          <h3>{sign.word}</h3>
          <p><strong>Shape:</strong> {sign.shape}</p>
          <p><strong>Place:</strong> {sign.place}</p>
          <p><strong>Move:</strong> {sign.move}</p>
          <button type="button" className="button quiet" onClick={stopCamera}>Close camera</button>
        </div>
      </div>
    </section>
  );
}
