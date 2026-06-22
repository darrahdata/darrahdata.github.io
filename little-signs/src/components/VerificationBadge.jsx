const copy = {
  verified: "Verified",
  "needs video source": "Needs video source",
  "regional variation possible": "Regional variation possible"
};

export default function VerificationBadge({ status }) {
  const safeStatus = status || "needs video source";
  return <span className={`verification ${safeStatus.replaceAll(" ", "-")}`}>{copy[safeStatus]}</span>;
}
