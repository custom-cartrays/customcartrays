import { put } from '@vercel/blob';

export async function uploadBase64(dataUrl, path, contentType = 'image/jpeg') {
  const token = process.env.PUBLIC_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('PUBLIC_BLOB_READ_WRITE_TOKEN is not configured');
  }

  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const blob = await put(path, buffer, {
    access: 'public',
    token,
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}
