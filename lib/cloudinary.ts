import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = "br-payments",
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else if (result)
            resolve({ url: result.secure_url, publicId: result.public_id });
          else reject(new Error("Upload failed"));
        },
      )
      .end(fileBuffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Entered delete for", publicId);
    console.log("Cloudinary config check:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✓ Set" : "✗ Missing",
      api_key: process.env.CLOUDINARY_API_KEY ? "✓ Set" : "✗ Missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "✓ Set" : "✗ Missing",
    });
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary destroy result:", result);
    
    if (result.result === "ok") {
      return { success: true };
    } else if (result.result === "not found") {
      return { success: true, error: "File not found (already deleted)" };
    } else {
      return { success: false, error: `Cloudinary error: ${result.result}` };
    }
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
