export default function SignDemo({ sign, compact = false }) {
  const sources = sign.source_links || [];
  const hasLocalVideo = Boolean(sign.video_url);

  return (
    <section className={compact ? "sign-demo compact" : "sign-demo"}>
      {hasLocalVideo ? (
        <div className="video-frame">
          <video controls playsInline preload="metadata" poster={sign.video_poster || undefined}>
            <source src={sign.video_url} type="video/mp4" />
            Your browser cannot play this sign video.
          </video>
        </div>
      ) : (
        <div className="video-placeholder source-ready">
          <span>▶️</span>
          <strong>Watch an actual sign demo</strong>
          <p>
            Open a trusted ASL or baby-sign source below. Add your own licensed MP4 later at
            <code> /videos/{sign.id}.mp4</code> to show it directly in the app.
          </p>
        </div>
      )}

      {sources.length > 0 && (
        <div className="source-links" aria-label={`Demo sources for ${sign.word}`}>
          {sources.map((source) => (
            <a
              key={`${sign.id}-${source.label}`}
              className="source-link"
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>{source.label}</span>
              <small>{source.note}</small>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
