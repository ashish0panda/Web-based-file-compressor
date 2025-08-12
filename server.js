const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Store status & files per unique fileId
const processingFiles = {};

// Serve your static frontend files
app.use(express.static('.'));

// POST /upload - upload multiple files
app.post('/upload', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).send('No files uploaded.');

  const fileId = crypto.randomBytes(8).toString('hex');

  processingFiles[fileId] = {
    ready: false,
    files: [],
  };

  // Ensure compressed directory exists
  if (!fs.existsSync('compressed')) fs.mkdirSync('compressed');

  let completed = 0;

  req.files.forEach((file) => {
    const inputPath = file.path;
    const outputPath = path.join('compressed', `${file.filename}.huff`);

    // Call your C++ compressor executable
    execFile('./compressor', [inputPath, outputPath], (error, stdout, stderr) => {
      // Delete uploaded file after compression
      fs.unlinkSync(inputPath);

      if (error) {
        console.error('Compression error:', stderr);
      } else {
        processingFiles[fileId].files.push({
          originalName: file.originalname,
          compressedPath: outputPath,
        });
      }

      completed++;
      if (completed === req.files.length) {
        processingFiles[fileId].ready = true;
      }
    });
  });

  // Redirect user to download page with fileId param
  res.redirect(`/download.html?fileId=${fileId}`);
});

// GET /check_ready/:fileId - check if compression done
app.get('/check_ready/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  if (!processingFiles[fileId]) return res.json({ ready: false });
  res.json({ ready: processingFiles[fileId].ready });
});

// GET /download_file/:fileId - download zip of compressed files
app.get('/download_file/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const info = processingFiles[fileId];

  if (!info || !info.ready) {
    return res.status(404).send('File not ready.');
  }
  if (info.files.length === 0) {
    return res.status(404).send('No compressed files.');
  }

  res.attachment('compressed_files.zip');
  const archive = archiver('zip');
  archive.pipe(res);

  info.files.forEach(({ originalName, compressedPath }) => {
    archive.file(compressedPath, { name: originalName });
  });

  archive.finalize();

  // Cleanup after sending
  archive.on('end', () => {
    info.files.forEach(({ compressedPath }) => {
      if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);
    });
    delete processingFiles[fileId];
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
