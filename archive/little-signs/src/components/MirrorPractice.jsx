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

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setStatus("requesting");
    let timedOut = false;
    let timeoutId;
    try {
      const cameraRequest = navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      cameraRequest.then((lateStream) => {
        if (timedOut || requestRef.current !== requestId) {
          lateStream.getTracks().forEach((track) => track.stop());
        }
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
      console.info("Mirror camera was not opened.", error?.name || error);
      setStatus("denied");
    }
  };

  return (
    <section className="mirror-practice card">
      <div>
        <p className="small-label">Optional mirror practice</p>
        <h2>See your own movement</h2>
        <p>Your camera stays on this device. Little Signs does not record, upload, save, or grade your sign.</p>
      </div>

      {status === "closed" && <button type="button" className="button primary" onClick={openCamera}>Open mirror</button>}
      {status === "requesting" && <p role="status">Waiting for camera permission…</p>}
      {(status === "denied" || status === "unavailable") && (
        <div className="camera-fallback" role="status">
          <strong>No camera? No problem.</strong>
          <p>Use a household mirror, or practice from the written steps below. Every lesson works without camera access.</p>
          {status === "denied" && <button type="button" className="button ghost" onClick={openCamera}>Try camera again</button>}
        </div>
      )}

      <div className={`mirror-grid ${status === "open" ? "visible" : ""}`} hidden={status !== "open"}>
        <video ref={videoRef} muted playsInline aria-label="Live mirror camera preview" />
        <div>
          <strong>Practice {sign.word}</strong>
          <ol>{(sign.steps || []).map((step) => <li key={step}>{step}</li>)}</ol>
          <p className="mirror-reminder">This mirror helps you self-check. It does not grade your sign.</p>
          <button type="button" className="button ghost" onClick={stopCamera}>Close mirror</button>
        </div>
      </div>
    </section>
  );
}
