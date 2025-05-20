import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { v2 as cloudinary } from "https://esm.sh/cloudinary@1.37.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: Deno.env.get("CLOUDINARY_CLOUD_NAME"),
      api_key: Deno.env.get("CLOUDINARY_API_KEY"),
      api_secret: Deno.env.get("CLOUDINARY_API_SECRET"),
      secure: true,
    });

    // Parse request body
    const { filename, publicId } = await req.json();

    if (!filename && !publicId) {
      return new Response(
        JSON.stringify({ error: "Either filename or publicId is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Search for existing assets with the same filename or public ID
    let searchResults;
    let deletedAssets = [];

    if (publicId) {
      // If we have a public ID, try to delete it directly
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: "video",
        });
        if (result.result === "ok") {
          deletedAssets.push(publicId);
        }
      } catch (error) {
        console.error(
          `Error deleting asset with public ID ${publicId}:`,
          error,
        );
        // Continue even if this fails - it might not exist
      }
    }

    if (filename) {
      // Search for assets with the same filename
      searchResults = await cloudinary.search
        .expression(`filename:${filename}*`)
        .resource_type("video")
        .execute();

      // Delete each found asset
      if (searchResults.total_count > 0) {
        for (const asset of searchResults.resources) {
          try {
            const result = await cloudinary.uploader.destroy(asset.public_id, {
              resource_type: "video",
            });
            if (result.result === "ok") {
              deletedAssets.push(asset.public_id);
            }
          } catch (error) {
            console.error(`Error deleting asset ${asset.public_id}:`, error);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${deletedAssets.length} existing assets`,
        deletedAssets,
        searchResults: searchResults || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in cloudinary-check-delete function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
