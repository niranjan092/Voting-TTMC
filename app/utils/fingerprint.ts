// utils/fingerprint.ts

export async function generateDeviceFingerprint(): Promise<string> {
  // 1. Gather hardware and browser metadata
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth.toString(),
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || "unknown",
  ];

  // 2. Add lightweight Canvas fingerprinting
  // Different GPUs and OS render anti-aliased text slightly differently.
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "16px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Techspire TM", 2, 15);
      components.push(canvas.toDataURL());
    }
  } catch (e) {
    // Canvas might be blocked by aggressive privacy extensions; fail gracefully.
    components.push("canvas-blocked");
  }

  // 3. Hash the string using SHA-256 for a clean, secure identifier
  const rawString = components.join("|||");
  const msgBuffer = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  
  // Convert ArrayBuffer to Hex String
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}