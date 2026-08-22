import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let r2Client: S3Client | null = null;

/**
 * Get or initialize the Cloudflare R2 S3 Client.
 * Uses environment variables:
 * - R2_ACCOUNT_ID (Cloudflare Account ID)
 * - R2_ACCESS_KEY_ID (R2 Access Key ID)
 * - R2_SECRET_ACCESS_KEY (R2 Secret Access Key)
 * - R2_BUCKET_NAME (Bucket name)
 * - R2_PUBLIC_URL (Optional custom domain / public R2 URL e.g. https://assets.yourdomain.com)
 */
export function getR2Client(): S3Client | null {
  if (r2Client) return r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'battery-storage-assets';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

/**
 * Generate a pre-signed upload URL for Cloudflare R2
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<{ uploadUrl: string; fileUrl: string } | null> {
  const client = getR2Client();
  if (!client) return null;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const fileUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}` : uploadUrl.split('?')[0];

  return { uploadUrl, fileUrl };
}

/**
 * Direct server-side upload to Cloudflare R2
 */
export async function uploadBufferToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}` : `https://${R2_BUCKET_NAME}.r2.cloudflarestorage.com/${key}`;
}

/**
 * Delete an object from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (e) {
    console.error('Error deleting from R2:', e);
    return false;
  }
}
