const cueOverrides = {
  milk: {
    summary: "Open and close your hand like a gentle squeeze.",
    frames: [
      { shape: "fist", label: "close" },
      { shape: "open", label: "open" },
      { shape: "fist", label: "repeat", motion: "pulse" }
    ]
  },
  more: {
    summary: "Bring both fingertip groups together and tap.",
    frames: [
      { shape: "pinch", label: "left" },
      { shape: "pinch", label: "right", flip: true },
      { shape: "two-pinch", label: "tap", motion: "tap" }
    ]
  },
  "all-done": {
    summary: "Turn both open hands outward like finished.",
    frames: [
      { shape: "open", label: "palms in" },
      { shape: "open", label: "turn" },
      { shape: "two-open", label: "palms out", motion: "flip" }
    ]
  },
  eat: {
    summary: "Bring a gathered hand toward your mouth.",
    frames: [
      { shape: "pinch", label: "gather" },
      { shape: "pinch", label: "to mouth", motion: "to-mouth" }
    ]
  },
  drink: {
    summary: "Hold a cup shape and tilt toward your mouth.",
    frames: [
      { shape: "c", label: "cup" },
      { shape: "c", label: "tilt", motion: "tilt" }
    ]
  },
  sleep: {
    summary: "Move an open hand down the face into rest.",
    frames: [
      { shape: "open", label: "face" },
      { shape: "pinch", label: "close", motion: "down" }
    ]
  },
  help: {
    summary: "One hand supports the other as it lifts.",
    frames: [
      { shape: "flat", label: "base" },
      { shape: "fist", label: "lift", motion: "up" }
    ]
  },
  mom: {
    summary: "Open hand with thumb near the chin area.",
    frames: [{ shape: "open", label: "thumb to chin" }]
  },
  dad: {
    summary: "Open hand with thumb near the forehead area.",
    frames: [{ shape: "open", label: "thumb to forehead" }]
  },
  please: {
    summary: "Flat hand circles gently over the chest.",
    frames: [{ shape: "flat", label: "circle", motion: "circle" }]
  },
  "thank-you": {
    summary: "Flat hand moves outward from the chin.",
    frames: [{ shape: "flat", label: "outward", motion: "out" }]
  },
  yes: {
    summary: "A fist nods up and down like saying yes.",
    frames: [{ shape: "fist", label: "nod", motion: "nod" }]
  },
  no: {
    summary: "Index and middle finger close to the thumb.",
    frames: [{ shape: "pinch", label: "close", motion: "tap" }]
  },
  again: {
    summary: "One hand taps back into the other hand.",
    frames: [
      { shape: "flat", label: "base" },
      { shape: "point", label: "again", motion: "tap" }
    ]
  },
  book: {
    summary: "Hands open like a little book.",
    frames: [
      { shape: "two-flat", label: "closed" },
      { shape: "two-open", label: "open", motion: "open-book" }
    ]
  },
  play: {
    summary: "Playful Y-like hands twist side to side.",
    frames: [{ shape: "play", label: "twist", motion: "wiggle" }]
  },
  love: {
    summary: "Hands cross close to the heart.",
    frames: [{ shape: "love", label: "hug", motion: "heart" }]
  },
  hurt: {
    summary: "Index fingers point toward the sore spot.",
    frames: [{ shape: "two-point", label: "point", motion: "pulse" }]
  },
  apple: {
    summary: "A bent finger twists near the cheek.",
    frames: [{ shape: "point", label: "twist", motion: "circle" }]
  },
  banana: {
    summary: "One finger is peeled like a banana.",
    frames: [{ shape: "point", label: "peel", motion: "down" }]
  },
  water: {
    summary: "A W hand taps near the chin.",
    frames: [{ shape: "three", label: "W tap", motion: "tap" }]
  },
  hungry: {
    summary: "A hand moves down the front of the body.",
    frames: [{ shape: "c", label: "down", motion: "down" }]
  },
  full: {
    summary: "A flat hand moves outward from the chest.",
    frames: [{ shape: "flat", label: "full", motion: "out" }]
  },
  prayer: {
    summary: "Hands come together in a prayer shape.",
    frames: [{ shape: "prayer", label: "together", motion: "pulse" }]
  },
  church: {
    summary: "A C-shaped hand taps over the other hand.",
    frames: [{ shape: "c", label: "tap", motion: "tap" }]
  },
  bless: {
    summary: "Hands move outward like giving a blessing.",
    frames: [{ shape: "two-flat", label: "out", motion: "out" }]
  },
  peace: {
    summary: "Hands cross and move outward calmly.",
    frames: [{ shape: "two-flat", label: "peace", motion: "out" }]
  },
  read: {
    summary: "Two fingers track down an open palm or page.",
    frames: [{ shape: "two-point", label: "scan", motion: "down" }]
  },
  listen: {
    summary: "A hand cues attention toward the ear.",
    frames: [{ shape: "point", label: "listen", motion: "to-ear" }]
  },
  quiet: {
    summary: "A finger gently cues quiet.",
    frames: [{ shape: "point", label: "shh", motion: "pulse" }]
  },
  walk: {
    summary: "Two fingers walk forward.",
    frames: [{ shape: "two-point", label: "walk", motion: "walk" }]
  },
  run: {
    summary: "Two hands move quickly forward.",
    frames: [{ shape: "two-point", label: "run", motion: "fast" }]
  },
  stretch: {
    summary: "Hands reach apart like a stretch.",
    frames: [{ shape: "two-open", label: "stretch", motion: "out" }]
  },
  strong: {
    summary: "Fists show strength and confidence.",
    frames: [{ shape: "two-fist", label: "strong", motion: "up" }]
  },
  tired: {
    summary: "Hands relax downward to show tired.",
    frames: [{ shape: "two-flat", label: "down", motion: "down" }]
  },
  think: {
    summary: "A finger points to the thinking spot.",
    frames: [{ shape: "point", label: "think", motion: "tap" }]
  },
  wait: {
    summary: "Hands wiggle gently as you wait.",
    frames: [{ shape: "two-open", label: "wait", motion: "wiggle" }]
  },
  turn: {
    summary: "Hands rotate like taking turns.",
    frames: [{ shape: "two-flat", label: "turn", motion: "circle" }]
  },
  happy: {
    summary: "Hands rise with a bright happy feeling.",
    frames: [{ shape: "two-flat", label: "happy", motion: "up" }]
  },
  sad: {
    summary: "Open hands move gently downward.",
    frames: [{ shape: "two-open", label: "sad", motion: "down" }]
  },
  scared: {
    summary: "Hands open outward like a startled feeling.",
    frames: [{ shape: "two-open", label: "open", motion: "out" }]
  },
  hug: {
    summary: "Arms curve inward like a hug.",
    frames: [{ shape: "love", label: "hug", motion: "heart" }]
  },
  diaper: {
    summary: "Hands tap near the waist like a diaper cue.",
    frames: [{ shape: "two-point", label: "waist", motion: "tap" }]
  },
  bath: {
    summary: "Fists move like gentle scrubbing at bath time.",
    frames: [{ shape: "two-fist", label: "scrub", motion: "wiggle" }]
  },
  outside: {
    summary: "An open hand moves outward toward outside.",
    frames: [{ shape: "open", label: "out", motion: "out" }]
  },
  god: {
    summary: "A reverent upward cue. Confirm the real ASL sign with a demo.",
    frames: [{ shape: "flat", label: "upward", motion: "up" }]
  },
  jesus: {
    summary: "A respectful faith cue. Watch a real demo for the exact sign.",
    frames: [{ shape: "prayer", label: "faith", motion: "pulse" }]
  },
  mary: {
    summary: "A gentle faith cue. Watch a real demo for the exact sign.",
    frames: [{ shape: "love", label: "Mary", motion: "heart" }]
  }
};

const defaultCue = {
  summary: "A simple yellow-hand memory cue. Watch a real demo for the full sign.",
  frames: [{ shape: "open", label: "cue", motion: "pulse" }]
};

function getCue(sign) {
  return cueOverrides[sign.id] || cueOverrides[sign.word?.toLowerCase()] || defaultCue;
}

function MotionMarks({ motion }) {
  if (!motion) return null;
  const common = { fill: "none", stroke: "#4c7a55", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round" };
  if (motion === "tap") return <path {...common} d="M89 46c13 8 18 18 13 30M100 38l12 3-5 11" />;
  if (motion === "pulse") return <path {...common} d="M97 38c9-7 18-7 27 0M101 82c9 7 18 7 27 0" />;
  if (motion === "up") return <path {...common} d="M112 88V43M101 54l11-12 11 12" />;
  if (motion === "down") return <path {...common} d="M112 40v46M101 75l11 12 11-12" />;
  if (motion === "out") return <path {...common} d="M38 66H15M26 55 14 66l12 11M122 66h23M134 55l12 11-12 11" />;
  if (motion === "tilt") return <path {...common} d="M100 43c22 16 24 38 6 56M106 39l14 2-6 13" />;
  if (motion === "circle") return <path {...common} d="M105 48c17 7 22 27 11 42-8 11-24 14-36 6M79 96l-3-13 13 3" />;
  if (motion === "wiggle") return <path {...common} d="M24 48c12-12 24 12 36 0s24 12 36 0 24 12 36 0" />;
  if (motion === "walk") return <path {...common} d="M34 100c26-26 51-26 76 0M100 87l13 12-15 7" />;
  if (motion === "fast") return <path {...common} d="M26 44h32M18 64h44M26 84h32" />;
  if (motion === "heart") return <path fill="#ef7f78" d="M118 46c-8-12-26-8-30 5-5-13-23-17-31-5-9 14 7 31 31 47 23-16 40-33 30-47z" opacity="0.75" />;
  if (motion === "to-mouth") return <path {...common} d="M84 65c16-2 29 4 39 18M118 68l10 15-18 1" />;
  if (motion === "to-ear") return <path {...common} d="M83 64c23-13 39-15 53-6M126 48l13 8-11 11" />;
  if (motion === "nod") return <path {...common} d="M107 38v54M96 82l11 12 11-12" />;
  if (motion === "flip") return <path {...common} d="M30 42c26-19 64-18 91 0M115 32l13 8-11 11" />;
  if (motion === "open-book") return <path {...common} d="M36 52c18-13 45-13 63 0M91 42l13 9-12 10" />;
  return null;
}

function HandShape({ shape = "open", x = 48, y = 38, scale = 1, rotate = 0, flip = false }) {
  const transform = `translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale}) rotate(${rotate})`;
  const skin = "#f6c84f";
  const shade = "#e6a83c";
  const outline = "#8a5a14";
  const stroke = { stroke: outline, strokeWidth: 3.2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (shape === "fist") {
    return (
      <g transform={transform}>
        <rect x="0" y="20" width="54" height="48" rx="20" fill={skin} {...stroke} />
        {[4, 17, 30, 41].map((fx) => <rect key={fx} x={fx} y="8" width="12" height="26" rx="7" fill={skin} {...stroke} />)}
        <path d="M6 48c15 6 31 6 46 0" fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  if (shape === "pinch") {
    return (
      <g transform={transform}>
        <ellipse cx="30" cy="48" rx="25" ry="22" fill={skin} {...stroke} />
        <path d="M27 25c10-19 31-14 27 4-2 10-14 16-25 15" fill={skin} {...stroke} />
        <path d="M12 37c-10-16 7-30 19-16 7 8 6 18-3 25" fill={skin} {...stroke} />
        <path d="M38 29c9 4 13 9 13 17" fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }

  if (shape === "point") {
    return (
      <g transform={transform}>
        <rect x="22" y="28" width="36" height="40" rx="18" fill={skin} {...stroke} />
        <rect x="34" y="-2" width="13" height="45" rx="7" fill={skin} {...stroke} />
        <path d="M23 45 4 34c-8-4-15 6-8 13l22 22" fill={skin} {...stroke} />
        <path d="M48 38h22" fill="none" {...stroke} />
      </g>
    );
  }

  if (shape === "flat") {
    return (
      <g transform={transform}>
        <rect x="13" y="8" width="12" height="46" rx="7" fill={skin} {...stroke} />
        <rect x="25" y="3" width="12" height="53" rx="7" fill={skin} {...stroke} />
        <rect x="37" y="7" width="12" height="49" rx="7" fill={skin} {...stroke} />
        <rect x="49" y="16" width="12" height="40" rx="7" fill={skin} {...stroke} />
        <rect x="15" y="44" width="48" height="38" rx="18" fill={skin} {...stroke} />
        <path d="M18 55 2 45c-8-5-16 7-9 14l25 24" fill={skin} {...stroke} />
      </g>
    );
  }

  if (shape === "c") {
    return (
      <g transform={transform}>
        <path d="M53 12c-30-7-55 14-55 40s25 47 55 40" fill="none" stroke={outline} strokeWidth="18" strokeLinecap="round" />
        <path d="M53 12c-30-7-55 14-55 40s25 47 55 40" fill="none" stroke={skin} strokeWidth="12" strokeLinecap="round" />
        <path d="M45 86c18 8 30-5 22-18" fill={skin} {...stroke} />
      </g>
    );
  }

  if (shape === "three") {
    return (
      <g transform={transform}>
        <rect x="10" y="12" width="13" height="47" rx="7" fill={skin} {...stroke} />
        <rect x="26" y="4" width="13" height="55" rx="7" fill={skin} {...stroke} />
        <rect x="42" y="12" width="13" height="47" rx="7" fill={skin} {...stroke} />
        <rect x="16" y="47" width="44" height="35" rx="17" fill={skin} {...stroke} />
        <text x="34" y="77" textAnchor="middle" fontSize="18" fontWeight="900" fill="#8a5a14">W</text>
      </g>
    );
  }

  if (shape === "play") {
    return (
      <g transform={transform}>
        <HandShape shape="point" x="-2" y="18" scale="0.55" rotate="-18" />
        <HandShape shape="point" x="50" y="18" scale="0.55" rotate="18" flip />
      </g>
    );
  }

  if (shape === "prayer") {
    return (
      <g transform={transform}>
        <HandShape shape="flat" x="12" y="2" scale="0.62" rotate="-16" />
        <HandShape shape="flat" x="54" y="2" scale="0.62" rotate="16" flip />
      </g>
    );
  }

  if (shape === "love") {
    return (
      <g transform={transform}>
        <HandShape shape="flat" x="6" y="20" scale="0.56" rotate="38" />
        <HandShape shape="flat" x="70" y="22" scale="0.56" rotate="-38" flip />
      </g>
    );
  }

  return (
    <g transform={transform}>
      <rect x="12" y="5" width="12" height="52" rx="7" fill={skin} {...stroke} />
      <rect x="26" y="0" width="12" height="59" rx="7" fill={skin} {...stroke} />
      <rect x="40" y="6" width="12" height="53" rx="7" fill={skin} {...stroke} />
      <rect x="54" y="18" width="12" height="41" rx="7" fill={skin} {...stroke} />
      <rect x="16" y="47" width="50" height="40" rx="20" fill={skin} {...stroke} />
      <path d="M17 61 2 51c-8-5-16 7-9 14l24 23" fill={skin} {...stroke} />
      <path d="M21 64c13 7 28 7 41 0" fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Frame({ frame, index, total }) {
  const shape = frame.shape;
  const isTwo = shape.startsWith("two-");
  const baseShape = isTwo ? shape.replace("two-", "") : shape;

  return (
    <div className="hand-frame">
      <svg viewBox="0 0 160 132" role="img" aria-label={`${frame.label || "hand cue"} frame`}>
        <rect x="8" y="8" width="144" height="116" rx="30" fill="#fff8e8" />
        {isTwo ? (
          <>
            <HandShape shape={baseShape} x={baseShape === "open" ? 24 : 28} y={36} scale={0.68} rotate={baseShape === "open" ? -8 : 0} />
            <HandShape shape={baseShape} x={baseShape === "open" ? 116 : 112} y={36} scale={0.68} rotate={baseShape === "open" ? 8 : 0} flip />
          </>
        ) : shape === "two-pinch" ? (
          <>
            <HandShape shape="pinch" x={34} y={38} scale={0.66} />
            <HandShape shape="pinch" x={126} y={38} scale={0.66} flip />
          </>
        ) : shape === "two-point" ? (
          <>
            <HandShape shape="point" x={34} y={38} scale={0.62} rotate={-8} />
            <HandShape shape="point" x={122} y={38} scale={0.62} rotate={8} flip />
          </>
        ) : shape === "two-fist" ? (
          <>
            <HandShape shape="fist" x={32} y={44} scale={0.72} rotate={-8} />
            <HandShape shape="fist" x={128} y={44} scale={0.72} rotate={8} flip />
          </>
        ) : (
          <HandShape shape={shape} x={50} y={28} scale={0.82} rotate={frame.motion === "tilt" ? -16 : 0} flip={frame.flip} />
        )}
        <MotionMarks motion={frame.motion} />
        {total > 1 && (
          <circle cx="28" cy="105" r="13" fill="#f4cf72" stroke="#8a5a14" strokeWidth="2" />
        )}
        {total > 1 && (
          <text x="28" y="110" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5d4213">{index + 1}</text>
        )}
      </svg>
      {frame.label && <span>{frame.label}</span>}
    </div>
  );
}

export default function YellowHandCue({ sign, variant = "thumb", showText = true }) {
  const cue = getCue(sign);
  const frames = variant === "thumb" ? [cue.frames[cue.frames.length - 1] || defaultCue.frames[0]] : cue.frames;

  return (
    <div className={`yellow-hand-cue ${variant}`}>
      <div className="hand-frames" style={{ "--frame-count": frames.length }}>
        {frames.map((frame, index) => (
          <Frame key={`${sign.id}-${index}-${frame.shape}`} frame={frame} index={index} total={frames.length} />
        ))}
      </div>
      {showText && (
        <div className="hand-cue-copy">
          <strong>{variant === "thumb" ? sign.word : "Yellow hand memory cue"}</strong>
          <p>{cue.summary}</p>
        </div>
      )}
    </div>
  );
}
