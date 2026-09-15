import { put } from '@vercel/blob';
export async function uploadBase64(dataUrl, path, contentType = 'image/jpeg') {
  const base64 = dataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const blob = await put(path, buffer, { access: 'public', contentType, addRandomSuffix: false });
  return blob.url;
}
