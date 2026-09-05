/**
 * Image optimization utility for logos and assets.
 * Automatically resizes and compresses images to fit well within Firestore document limits (<100KB).
 */

export async function optimizeLogoImage(
  input: File | string,
  maxDimension = 256,
  targetMaxBytes = 150 * 1024 // 150 KB max target
): Promise<string> {
  // If it's a remote URL (http:// or https://), no need to compress base64
  if (typeof input === "string" && (input.startsWith("http://") || input.startsWith("https://"))) {
    return input;
  }

  // If input is string but already tiny base64
  if (typeof input === "string" && input.startsWith("data:") && input.length < 50 * 1024) {
    return input;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not initialize canvas 2D context");
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first at high quality (0.85)
        let dataUrl = canvas.toDataURL("image/webp", 0.85);

        // Fallback to PNG if webp is unsupported
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/png");
        }

        // If data URL is still unexpectedly large, compress with lower quality
        if (dataUrl.length > targetMaxBytes) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error("Unable to load image for optimization"));
    };

    if (typeof input === "string") {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || "";
      };
      reader.onerror = () => {
        reject(new Error("Failed to read image file"));
      };
      reader.readAsDataURL(input);
    }
  });
}
