/**
 * File Uploads — S3 signed upload flow
 *
 * Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer @types/multer
 *
 * Flow:
 *  1. Client calls POST /uploads/presign  → gets a presigned PUT URL + fileKey
 *  2. Client uploads directly to S3 using the URL (no traffic through server)
 *  3. Client sends fileKey to your API as part of the resource payload
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { BadRequestError } from '../types/errors';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const s3 = new S3Client({
  region: config.s3.region,
  ...(config.app.isDev && {
    // Point to localstack or minio in dev
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:4566',
    forcePathStyle: true,
  }),
  credentials:
    config.s3.accessKeyId && config.s3.secretAccessKey
      ? { accessKeyId: config.s3.accessKeyId, secretAccessKey: config.s3.secretAccessKey }
      : undefined,
});

export interface PresignResult {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

export async function getPresignedUploadUrl(
  mimeType: string,
  folder = 'uploads',
): Promise<PresignResult> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestError(
      `File type not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    );
  }

  const ext = mimeType.split('/')[1];
  const fileKey = `${folder}/${uuid()}.${ext}`;
  const expiresIn = 300; // 5 minutes to upload

  const command = new PutObjectCommand({
    Bucket: config.s3.bucketName,
    Key: fileKey,
    ContentType: mimeType,
    ContentLengthRange: [1, config.s3.maxFileSizeMb * 1024 * 1024],
  } as Parameters<typeof PutObjectCommand>[0]);

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

  return { uploadUrl, fileKey, expiresIn };
}

export function getPublicUrl(fileKey: string): string {
  return `https://${config.s3.bucketName ?? 'bucket'}.s3.${config.s3.region}.amazonaws.com/${fileKey}`;
}

export async function deleteFile(fileKey: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.s3.bucketName,
      Key: fileKey,
    }),
  );
}
