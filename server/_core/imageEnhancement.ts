export async function removeBackground(
  imageBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    console.log("[ImageEnhancement] REMOVE_BG_API_KEY not configured, skipping background removal.");
    return null;
  }

  try {
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append("image_file", blob, filename);
    formData.append("size", "auto");
    formData.append("format", "png");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`[ImageEnhancement] remove.bg failed: ${response.status} ${text}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: "image/png", // remove.bg returns PNG
    };
  } catch (error) {
    console.warn("[ImageEnhancement] Background removal error:", error);
    return null;
  }
}
