/**
 * Utility functions for debugging Cloudinary issues
 */

export interface CloudinaryErrorInfo {
  status: number;
  statusText: string;
  url: string;
  cloudinaryError?: string;
  headers: Record<string, string>;
}

/**
 * Check if a Cloudinary URL is accessible and return detailed error information
 */
export async function checkCloudinaryUrl(
  url: string,
): Promise<CloudinaryErrorInfo> {
  try {
    console.log(`Checking Cloudinary URL: ${url}`);

    const response = await fetch(url, {
      method: "HEAD",
      // Ensure we're not using cached responses
      cache: "no-cache",
      // Add a random parameter to bypass cache
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
      },
    });

    // Extract headers into a plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const result: CloudinaryErrorInfo = {
      status: response.status,
      statusText: response.statusText,
      url,
      headers,
      cloudinaryError: headers["x-cld-error"],
    };

    console.log("Cloudinary URL check result:", result);
    return result;
  } catch (error) {
    console.error(`Error checking Cloudinary URL ${url}:`, error);
    return {
      status: 0,
      statusText: error.message || "Network error",
      url,
      headers: {},
    };
  }
}

/**
 * Parse a Cloudinary URL to extract its components
 */
export function parseCloudinaryUrl(url: string) {
  try {
    // Basic URL parsing
    const parsedUrl = new URL(url);

    // Extract Cloudinary-specific parts
    const pathParts = parsedUrl.pathname.split("/");

    // Find resource type (video, image, etc)
    const resourceTypeIndex = pathParts.findIndex((part) =>
      ["video", "image", "raw", "auto"].includes(part),
    );

    const resourceType =
      resourceTypeIndex !== -1 ? pathParts[resourceTypeIndex] : "unknown";

    // Find delivery type (upload, fetch, etc)
    const deliveryTypeIndex =
      resourceTypeIndex !== -1 ? resourceTypeIndex + 1 : -1;
    const deliveryType =
      deliveryTypeIndex !== -1 && deliveryTypeIndex < pathParts.length
        ? pathParts[deliveryTypeIndex]
        : "unknown";

    // Extract version if present
    const versionRegex = /v\d+/;
    const versionPart = pathParts.find((part) => versionRegex.test(part));
    const version = versionPart || "none";

    // Extract transformations
    const transformations = parsedUrl.pathname
      .split("/")
      .filter((part) => part.includes(",") || part.includes("_"))
      .join("/");

    return {
      url,
      host: parsedUrl.host,
      protocol: parsedUrl.protocol,
      resourceType,
      deliveryType,
      version,
      transformations,
      queryParams: parsedUrl.search,
      pathParts,
    };
  } catch (error) {
    console.error(`Error parsing Cloudinary URL ${url}:`, error);
    return {
      url,
      error: error.message,
      isValid: false,
    };
  }
}

/**
 * Generate alternative URLs to try if the original URL fails
 */
export function generateAlternativeUrls(url: string): string[] {
  const alternatives: string[] = [];
  const parsedUrl = parseCloudinaryUrl(url);

  // If we couldn't parse the URL, return empty alternatives
  if ("error" in parsedUrl) {
    return [];
  }

  // Get base URL without query parameters for cleaner transformations
  const baseUrl = url.split("?")[0];

  // Try with explicit format conversions (most compatible formats first)
  // Try with the most compatible formats first (H.264 codec with progressive loading)
  // Add more variations with different resolutions and quality settings
  alternatives.push(
    `${baseUrl}?f_mp4,vc_h264,vc_auto,q_auto:low,fl_progressive`,
  );
  alternatives.push(
    `${baseUrl}?f_mp4,vc_h264,w_640,h_360,q_auto:low,fl_progressive`,
  );
  alternatives.push(
    `${baseUrl}?f_mp4,vc_h264,w_480,h_270,q_auto:low,fl_progressive`,
  );
  alternatives.push(`${baseUrl}?f_mp4,vc_h264,q_auto:low`);
  alternatives.push(`${baseUrl}?f_mp4,vc_h264,q_60,fl_progressive`);
  alternatives.push(`${baseUrl}?f_mp4,vc_h264,w_640,fl_progressive`);
  alternatives.push(`${baseUrl}?f_auto,q_auto:low`);
  // Add WebM format as a fallback for some browsers
  alternatives.push(`${baseUrl}?f_webm,vc_vp9,q_auto:low`);

  return alternatives;
}
