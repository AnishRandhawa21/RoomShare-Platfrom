import { NextRequest } from "next/server";
import { getR2ObjectStream } from "@/lib/storage/r2";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    if (!key || key.length === 0) {
      return new Response("Not Found", { status: 404 });
    }

    const storageKey = key.join("/");
    const obj = await getR2ObjectStream(storageKey);

    if (!obj.Body) {
      return new Response("File Not Found", { status: 404 });
    }

    // Convert AWS SDK stream to Web ReadableStream
    const stream = obj.Body.transformToWebStream();

    const headers = new Headers();
    if (obj.ContentType) {
      headers.set("Content-Type", obj.ContentType);
    }
    if (obj.ContentLength) {
      headers.set("Content-Length", obj.ContentLength.toString());
    }

    // Cache indefinitely since UUID keys are immutable
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error?.name === "NoSuchKey") {
      return new Response("Not Found", { status: 404 });
    }
    console.error("Storage streaming error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
