import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  return new S3Client({
    endpoint,
    region: process.env.S3_REGION || "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || "",
      secretAccessKey: process.env.S3_SECRET_KEY || "",
    },
    // Force path-style for MinIO / R2
    forcePathStyle: !!endpoint,
  });
}

function getBucketName(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET env var is required");
  return bucket;
}

export class ObjectStorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = getS3Client();
    this.bucket = getBucketName();
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const key = `uploads/${objectId}`;

    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: 900 }
    );
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a normalized path, return as-is
    if (rawPath.startsWith("/objects/")) return rawPath;
    // If it's a full S3 URL, extract the key
    try {
      const url = new URL(rawPath);
      const key = url.pathname.slice(1); // remove leading /
      return `/objects/${key}`;
    } catch {
      return rawPath;
    }
  }

  async getObjectEntityFile(objectPath: string): Promise<{ key: string; metadata: Record<string, string>; body: ReadableStream }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const key = objectPath.slice("/objects/".length);
    if (!key) throw new ObjectNotFoundError();

    try {
      const head = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key })
      );

      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );

      if (!response.Body) throw new ObjectNotFoundError();

      return {
        key,
        metadata: {
          "Content-Type": response.ContentType || "application/octet-stream",
          "Content-Length": String(response.ContentLength || 0),
          "Cache-Control": "public, max-age=3600",
        },
        body: response.Body as unknown as ReadableStream,
      };
    } catch {
      throw new ObjectNotFoundError();
    }
  }

  async canAccessObjectEntity(): Promise<boolean> {
    // S3-compatível: acesso é controlado por presigned URLs e bucket policy
    return true;
  }
}
