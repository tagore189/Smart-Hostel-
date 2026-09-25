import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// File filter for images, videos, and documents
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Videos
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images, Videos (MP4/MOV), and Documents (PDF/DOC).`));
  }
};

export const getFileType = (mimetype: string): 'image' | 'video' | 'document' => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'document';
};

export const isFileContentValid = (buffer: Buffer, mimetype: string): boolean => {
  if (mimetype === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimetype === 'image/gif') return ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
  if (mimetype === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (mimetype === 'application/pdf') return buffer.toString('ascii', 0, 5) === '%PDF-';
  if (mimetype === 'application/msword') return buffer.subarray(0, 4).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0]));
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return buffer.toString('ascii', 0, 2) === 'PK';
  if (mimetype === 'video/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (['video/mp4', 'video/quicktime'].includes(mimetype)) return buffer.toString('ascii', 4, 8) === 'ftyp';
  if (mimetype === 'video/x-msvideo') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'AVI ';
  if (mimetype === 'text/plain') return !buffer.includes(0);
  return false;
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter,
});
