import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

const DATA_DIR = path.resolve(process.cwd(), 'storage');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const CHUNKS_DIR = path.join(DATA_DIR, 'chunks');
const THUMBNAILS_DIR = path.join(DATA_DIR, 'thumbnails');
const RESUME_DIR = path.join(DATA_DIR, 'resume');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const STATE_FILE = path.join(DATA_DIR, 'portfolio_state.json');

for (const dir of [
  DATA_DIR,
  UPLOADS_DIR,
  CHUNKS_DIR,
  THUMBNAILS_DIR,
  RESUME_DIR,
  IMAGES_DIR,
  AUDIO_DIR,
]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

interface UploadSessionMeta {
  uploadId: string;
  mediaId: string;
  filename: string;
  storedFileName: string;
  mimeType: string;
  totalSize: number;
  uploadedBytes: number;
  createdAt: number;
}

const getSessionMetaPath = (uploadId: string) =>
  path.join(CHUNKS_DIR, `${uploadId.replace(/[^a-zA-Z0-9_-]/g, '')}.json`);

const getSessionPartPath = (uploadId: string) =>
  path.join(CHUNKS_DIR, `${uploadId.replace(/[^a-zA-Z0-9_-]/g, '')}.part`);

// Parse JSON for state synchronization and upload session init/complete
app.use('/api/portfolio', express.json({ limit: '25mb' }));
app.use('/api/media/upload/init', express.json());
app.use('/api/media/upload/complete', express.json());

// Persistent Portfolio State API (shared across devices, tabs, and refreshes)
app.get('/api/portfolio', (_req, res) => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const content = fs.readFileSync(STATE_FILE, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(content);
      return;
    }
    res.json({ state: null });
  } catch (err) {
    console.error('[Server] Error reading portfolio state:', err);
    res.status(500).json({ error: 'Failed to read portfolio state' });
  }
});

app.post('/api/portfolio', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    console.error('[Server] Error saving portfolio state:', err);
    res.status(500).json({ error: 'Failed to save portfolio state' });
  }
});

// 1. Initialize or Resume a Chunked / Resumable Video Upload Session
app.post('/api/media/upload/init', (req, res) => {
  try {
    const { uploadId, mediaId, filename, size, mimeType } = req.body || {};
    if (!uploadId || !filename || typeof size !== 'number') {
      res.status(400).json({
        code: 'INVALID_INIT_PARAMS',
        error: 'Missing required uploadId, filename, or size',
      });
      return;
    }

    const safeUploadId = String(uploadId).replace(/[^a-zA-Z0-9_-]/g, '');
    const safeMediaId = String(mediaId || `media-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(filename) || '.mp4';
    const storedFileName = `${safeMediaId}${ext}`;

    const metaPath = getSessionMetaPath(safeUploadId);
    const partPath = getSessionPartPath(safeUploadId);

    if (fs.existsSync(metaPath) && fs.existsSync(partPath)) {
      const existingMeta: UploadSessionMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const stat = fs.statSync(partPath);
      existingMeta.uploadedBytes = stat.size;
      fs.writeFileSync(metaPath, JSON.stringify(existingMeta, null, 2), 'utf-8');

      res.json({
        ok: true,
        resumed: true,
        uploadId: safeUploadId,
        mediaId: existingMeta.mediaId,
        uploadedBytes: stat.size,
        storedFileName: existingMeta.storedFileName,
      });
      return;
    }

    fs.writeFileSync(partPath, Buffer.alloc(0));
    const newMeta: UploadSessionMeta = {
      uploadId: safeUploadId,
      mediaId: safeMediaId,
      filename,
      storedFileName,
      mimeType: mimeType || 'video/mp4',
      totalSize: size,
      uploadedBytes: 0,
      createdAt: Date.now(),
    };
    fs.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2), 'utf-8');

    res.json({
      ok: true,
      resumed: false,
      uploadId: safeUploadId,
      mediaId: safeMediaId,
      uploadedBytes: 0,
      storedFileName,
    });
  } catch (err: any) {
    console.error('[Server] Upload init error:', err);
    res.status(500).json({
      code: err?.code || 'UPLOAD_INIT_FAILED',
      error: err?.message || 'Failed to initialize resumable upload session',
    });
  }
});

// 2. Query Resumable Upload Status
app.get('/api/media/upload/status/:uploadId', (req, res) => {
  try {
    const safeUploadId = String(req.params.uploadId).replace(/[^a-zA-Z0-9_-]/g, '');
    const metaPath = getSessionMetaPath(safeUploadId);
    const partPath = getSessionPartPath(safeUploadId);

    if (!fs.existsSync(metaPath) || !fs.existsSync(partPath)) {
      res.status(404).json({ code: 'SESSION_NOT_FOUND', error: 'Upload session not found' });
      return;
    }

    const meta: UploadSessionMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const stat = fs.statSync(partPath);
    res.json({
      ok: true,
      uploadId: safeUploadId,
      mediaId: meta.mediaId,
      uploadedBytes: stat.size,
      totalSize: meta.totalSize,
    });
  } catch (err: any) {
    res.status(500).json({
      code: 'STATUS_CHECK_FAILED',
      error: err?.message || 'Failed to check upload status',
    });
  }
});

// 3. Append Binary Chunk to Resumable Upload
app.post('/api/media/upload/chunk', (req, res) => {
  try {
    const rawUploadId = (req.headers['x-upload-id'] as string) || '';
    const safeUploadId = rawUploadId.replace(/[^a-zA-Z0-9_-]/g, '');
    const offsetHeader = parseInt((req.headers['x-chunk-offset'] as string) || '0', 10);

    if (!safeUploadId) {
      res.status(400).json({ code: 'MISSING_UPLOAD_ID', error: 'Missing x-upload-id header' });
      return;
    }

    const metaPath = getSessionMetaPath(safeUploadId);
    const partPath = getSessionPartPath(safeUploadId);

    if (!fs.existsSync(metaPath) || !fs.existsSync(partPath)) {
      res.status(404).json({ code: 'SESSION_NOT_FOUND', error: 'Upload session expired or missing' });
      return;
    }

    const currentStat = fs.statSync(partPath);
    if (offsetHeader < currentStat.size) {
      fs.truncateSync(partPath, offsetHeader);
    } else if (offsetHeader > currentStat.size) {
      res.status(409).json({
        code: 'OFFSET_MISMATCH',
        error: `Chunk offset mismatch. Expected ${currentStat.size}, got ${offsetHeader}`,
        uploadedBytes: currentStat.size,
      });
      return;
    }

    const writeStream = fs.createWriteStream(partPath, { flags: 'a' });
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      try {
        const updatedStat = fs.statSync(partPath);
        const meta: UploadSessionMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        meta.uploadedBytes = updatedStat.size;
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

        res.json({
          ok: true,
          uploadedBytes: updatedStat.size,
        });
      } catch (finishErr: any) {
        res.status(500).json({
          code: 'CHUNK_META_UPDATE_FAILED',
          error: finishErr?.message || 'Failed updating chunk metadata',
        });
      }
    });

    writeStream.on('error', (err: any) => {
      console.error('[Server] Chunk write stream error:', err);
      res.status(500).json({
        code: err?.code || 'CHUNK_WRITE_FAILED',
        error: err?.message || 'Failed writing video chunk to storage',
      });
    });
  } catch (err: any) {
    console.error('[Server] Unexpected chunk upload error:', err);
    res.status(500).json({
      code: err?.code || 'CHUNK_UPLOAD_ERROR',
      error: err?.message || 'Unexpected error during chunk upload',
    });
  }
});

// 4. Finalize Resumable Upload
app.post('/api/media/upload/complete', (req, res) => {
  try {
    const { uploadId } = req.body || {};
    const safeUploadId = String(uploadId || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const metaPath = getSessionMetaPath(safeUploadId);
    const partPath = getSessionPartPath(safeUploadId);

    if (!fs.existsSync(metaPath) || !fs.existsSync(partPath)) {
      res.status(404).json({
        code: 'SESSION_NOT_FOUND',
        error: 'Upload session not found for completion',
      });
      return;
    }

    const meta: UploadSessionMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const stat = fs.statSync(partPath);

    if (meta.totalSize > 0 && stat.size !== meta.totalSize) {
      res.status(400).json({
        code: 'INCOMPLETE_UPLOAD',
        error: `Uploaded file size (${stat.size}) does not match expected size (${meta.totalSize})`,
        uploadedBytes: stat.size,
      });
      return;
    }

    const finalPath = path.join(UPLOADS_DIR, meta.storedFileName);
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
    fs.renameSync(partPath, finalPath);
    fs.unlinkSync(metaPath);

    const publicMediaUrl = `/api/media/stream/${meta.storedFileName}`;
    res.json({
      ok: true,
      mediaId: meta.mediaId,
      filename: meta.filename,
      storedFileName: meta.storedFileName,
      size: stat.size,
      mimeType: meta.mimeType,
      mediaUrl: publicMediaUrl,
      storageUrl: publicMediaUrl,
    });
  } catch (err: any) {
    console.error('[Server] Upload finalize error:', err);
    res.status(500).json({
      code: err?.code || 'UPLOAD_COMPLETE_FAILED',
      error: err?.message || 'Failed to finalize uploaded video file',
    });
  }
});

// Direct binary upload endpoint for small videos (< 2 MB)
app.post('/api/media/upload', (req, res) => {
  try {
    const rawFilename = (req.headers['x-filename'] as string) || 'video.mp4';
    const mediaId = (req.headers['x-media-id'] as string) || `media-${Date.now()}`;
    const safeExt = path.extname(decodeURIComponent(rawFilename)) || '.mp4';
    const storedFileName = `${mediaId.replace(/[^a-zA-Z0-9_-]/g, '')}${safeExt}`;
    const targetPath = path.join(UPLOADS_DIR, storedFileName);

    const writeStream = fs.createWriteStream(targetPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const publicUrl = `/api/media/stream/${storedFileName}`;
      res.json({
        ok: true,
        mediaUrl: publicUrl,
        storageUrl: publicUrl,
        storedFileName,
      });
    });

    writeStream.on('error', (err: any) => {
      console.error('[Server] Error writing uploaded video stream:', err);
      res.status(500).json({
        code: err?.code || 'DIRECT_UPLOAD_FAILED',
        error: err?.message || 'Upload stream failed',
      });
    });
  } catch (err: any) {
    console.error('[Server] Unexpected upload error:', err);
    res.status(500).json({
      code: err?.code || 'DIRECT_UPLOAD_ERROR',
      error: err?.message || 'Upload failed',
    });
  }
});

// 5. Store generated JPEG thumbnail image as a binary file on disk
app.post('/api/media/thumbnail/:mediaId', (req, res) => {
  try {
    const safeMediaId = String(req.params.mediaId).replace(/[^a-zA-Z0-9_-]/g, '');
    const thumbFilename = `${safeMediaId}.jpg`;
    const thumbPath = path.join(THUMBNAILS_DIR, thumbFilename);

    const writeStream = fs.createWriteStream(thumbPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const publicThumbUrl = `/api/media/thumbnail/${thumbFilename}?t=${Date.now()}`;
      res.json({
        ok: true,
        thumbnailUrl: publicThumbUrl,
      });
    });

    writeStream.on('error', (err: any) => {
      console.error('[Server] Thumbnail write error:', err);
      res.status(500).json({ error: 'Failed to store thumbnail' });
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save thumbnail' });
  }
});

// Serve stored thumbnail files
app.get('/api/media/thumbnail/:filename', (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(THUMBNAILS_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).end();
      return;
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.status(500).end();
  }
});

// 6. Upload, Serve & Delete Persistent Image Assets (Logo, Portrait, Software Logos, Social Icons, Before/After Images)
app.post('/api/media/image', (req, res) => {
  try {
    const rawFilename = decodeURIComponent((req.headers['x-filename'] as string) || 'image.png');
    const mimeType = (req.headers['content-type'] as string) || 'image/png';
    const ext = path.extname(rawFilename).toLowerCase() || '.png';
    const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']);
    if (!allowedExts.has(ext)) {
      res.status(400).json({ error: 'Unsupported image format. Use PNG, JPG, JPEG, WEBP, or SVG.' });
      return;
    }

    const imageId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const storedFileName = `${imageId}${ext}`;
    const targetPath = path.join(IMAGES_DIR, storedFileName);

    const writeStream = fs.createWriteStream(targetPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stat = fs.statSync(targetPath);
      const imageUrl = `/api/media/image/${storedFileName}`;
      res.json({
        ok: true,
        id: imageId,
        storedFileName,
        filename: rawFilename,
        imageUrl,
        mimeType,
        size: stat.size,
      });
    });

    writeStream.on('error', (err: any) => {
      console.error('[Server] Image upload error:', err);
      res.status(500).json({ error: 'Failed to save image' });
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Image upload failed' });
  }
});

app.get('/api/media/image/:filename', (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(IMAGES_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).end();
      return;
    }
    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.status(500).end();
  }
});

app.delete('/api/media/image/:filename', (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(IMAGES_DIR, safeName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete image' });
  }
});

// 7. Upload, Replace, Delete & Stream Audio Files (Background Music & Custom SFX)
app.post('/api/audio/upload', (req, res) => {
  try {
    const rawFilename = decodeURIComponent((req.headers['x-filename'] as string) || 'audio.mp3');
    const slotKey = ((req.headers['x-audio-slot'] as string) || 'bgm').replace(/[^a-zA-Z0-9_-]/g, '');
    const mimeType = (req.headers['content-type'] as string) || 'audio/mpeg';
    const ext = path.extname(rawFilename).toLowerCase() || '.mp3';
    const allowedExts = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm']);

    if (!allowedExts.has(ext)) {
      res.status(400).json({ error: 'Unsupported audio format. Please upload MP3, WAV, OGG, M4A, or AAC.' });
      return;
    }

    // Remove previous audio file for the same slot if present
    for (const existing of fs.readdirSync(AUDIO_DIR)) {
      if (existing.startsWith(`audio_${slotKey}_`)) {
        try {
          fs.unlinkSync(path.join(AUDIO_DIR, existing));
        } catch {
          // ignore
        }
      }
    }

    const storedFileName = `audio_${slotKey}_${Date.now()}${ext}`;
    const targetPath = path.join(AUDIO_DIR, storedFileName);

    const writeStream = fs.createWriteStream(targetPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stat = fs.statSync(targetPath);
      const audioUrl = `/api/audio/stream/${storedFileName}`;
      res.json({
        ok: true,
        slotKey,
        filename: rawFilename,
        storedFileName,
        audioUrl,
        mimeType,
        size: stat.size,
      });
    });

    writeStream.on('error', (err: any) => {
      console.error('[Server] Audio upload error:', err);
      res.status(500).json({ error: 'Failed to save audio file' });
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Audio upload failed' });
  }
});

app.get('/api/audio/stream/:filename', (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(AUDIO_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).end();
      return;
    }
    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.webm': 'audio/webm',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(filePath, { acceptRanges: true, dotfiles: 'allow' });
  } catch {
    res.status(500).end();
  }
});

app.delete('/api/audio/:filename', (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(AUDIO_DIR, safeName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete audio file' });
  }
});

// 8. Upload, Replace, Delete & Download Resume / CV File (.pdf, .doc, .docx)
app.post('/api/resume/upload', (req, res) => {
  try {
    const rawFilename = decodeURIComponent((req.headers['x-filename'] as string) || 'Resume_CV.pdf');
    const mimeType = (req.headers['content-type'] as string) || 'application/pdf';
    const ext = path.extname(rawFilename).toLowerCase() || '.pdf';
    const allowedExts = new Set(['.pdf', '.doc', '.docx']);

    if (!allowedExts.has(ext)) {
      res.status(400).json({ error: 'Unsupported resume format. Please upload PDF, DOC, or DOCX.' });
      return;
    }

    for (const existing of fs.readdirSync(RESUME_DIR)) {
      try {
        fs.unlinkSync(path.join(RESUME_DIR, existing));
      } catch {
        // ignore
      }
    }

    const resumeId = `resume-${Date.now()}`;
    const safeBaseName = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFileName = `${resumeId}_${safeBaseName}`;
    const targetPath = path.join(RESUME_DIR, storedFileName);

    const writeStream = fs.createWriteStream(targetPath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stat = fs.statSync(targetPath);
      const now = Date.now();
      const fileUrl = `/api/resume/download/${encodeURIComponent(storedFileName)}`;
      res.json({
        ok: true,
        resume: {
          id: resumeId,
          type: 'resume',
          filename: rawFilename,
          fileUrl,
          mimeType,
          size: stat.size,
          createdAt: now,
          updatedAt: now,
        },
      });
    });

    writeStream.on('error', (err: any) => {
      console.error('[Server] Resume upload error:', err);
      res.status(500).json({ error: 'Failed to store resume file' });
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Resume upload failed' });
  }
});

app.delete('/api/resume', (_req, res) => {
  try {
    for (const existing of fs.readdirSync(RESUME_DIR)) {
      try {
        fs.unlinkSync(path.join(RESUME_DIR, existing));
      } catch {
        // ignore
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete resume' });
  }
});

app.get('/api/resume/download/:filename', (req, res) => {
  try {
    const safeName = path.basename(decodeURIComponent(req.params.filename));
    const filePath = path.join(RESUME_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Resume file not found' });
      return;
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const originalDisplayFilename = safeName.replace(/^resume-\d+_/, '');
    const isPreview = req.query.preview === '1';

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${isPreview ? 'inline' : 'attachment'}; filename="${originalDisplayFilename}"`
    );
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.status(500).end();
  }
});

// 9. HTTP Range-capable video streaming endpoint using Express native sendFile
const handleMediaStream = (req: express.Request, res: express.Response) => {
  try {
    const safeName = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Media file not found' });
      return;
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.ogg': 'video/ogg',
    };
    const contentType = mimeMap[ext] || 'video/mp4';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    res.setHeader('Cache-Control', 'no-transform, public, max-age=3600');

    res.sendFile(filePath, { acceptRanges: true, dotfiles: 'allow' }, (err) => {
      if (err && !res.headersSent) {
        res.status(500).end();
      }
    });
  } catch (err) {
    console.error('[Server] Error streaming media file:', err);
    if (!res.headersSent) {
      res.status(500).end();
    }
  }
};

app.options('/api/media/stream/:filename', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.status(204).end();
});

app.head('/api/media/stream/:filename', handleMediaStream);
app.get('/api/media/stream/:filename', handleMediaStream);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
