const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Use ffmpeg-static only if its binary was actually downloaded; otherwise use ffmpeg from your PATH
try {
  const p = require('ffmpeg-static');
  if (p && fs.existsSync(p)) ffmpeg.setFfmpegPath(p);
} catch (_) {
  /* not installed, fall back to system ffmpeg */
}

const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 600 * 1024 * 1024 }, // 600 MB
  fileFilter: (req, file, cb) => {
    const isMp4 =
      file.mimetype === 'video/mp4' || path.extname(file.originalname).toLowerCase() === '.mp4';
    if (isMp4) return cb(null, true);
    const err = new Error('Only MP4 files are supported.');
    err.statusCode = 400;
    cb(err);
  },
});

app.use(express.static(path.join(__dirname, 'public')));

// ------------------ helpers ------------------

// Unique temp file path, so two requests never overwrite each other
const tempPath = (ext) => path.join(UPLOAD_DIR, `${crypto.randomUUID()}.${ext}`);

// Strip characters that are unsafe in file names
const safeName = (text, fallback) => {
  const cleaned = String(text || '')
    .replace(/[\x00-\x1f\/\\?%*:|"<>.]/g, '')
    .trim()
    .slice(0, 100);
  return cleaned || fallback;
};

const removeFiles = (files) =>
  files.forEach((f) =>
    fs.unlink(f, (err) => {
      if (err && err.code !== 'ENOENT') console.error(`Error deleting ${f}:`, err);
    })
  );

const runFfmpeg = (command, output) =>
  new Promise((resolve, reject) => {
    command.on('end', resolve).on('error', reject).save(output);
  });

// ------------------ routes ------------------

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/convert', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Please upload an MP4 file.');
  }

  const inputPath = req.file.path;
  const mp3Path = tempPath('mp3');
  const displayName = safeName(path.parse(req.file.originalname).name, 'audio');

  // Delete the upload and the converted file once the response is finished (or the user cancels)
  let cleaned = false;
  const finish = () => {
    if (cleaned) return;
    cleaned = true;
    removeFiles([inputPath, mp3Path]);
  };
  res.on('close', finish);

  try {
    await runFfmpeg(
      ffmpeg(inputPath).noVideo().audioCodec('libmp3lame').audioBitrate(192).format('mp3'),
      mp3Path
    );

    res.download(mp3Path, `${displayName}.mp3`, (err) => {
      if (err) {
        console.error('Download to client failed:', err);
        if (!res.headersSent) res.status(500).send('File download to client failed.');
      }
      finish();
    });
  } catch (err) {
    console.error('Conversion failed:', err);
    if (!res.headersSent) res.status(500).send('Conversion failed: ' + err.message);
    finish();
  }
});

// Handles errors thrown before the route runs, such as the file type or size limit
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).send('File is too large (max 600 MB).');
  }
  res.status(err.statusCode || 500).send(err.message || 'Server error');
});

// ------------------ start ------------------
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
server.setTimeout(10 * 60 * 1000); // 10 minutes for long conversions
