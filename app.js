
// app.js
const express = require('express');
const multer  = require('multer');
const axios   = require('axios');
const path    = require('path');
const fs = require('fs');

const app     = express();
const upload  = multer();               // in-memory storage
const IPFS_API = 'http://localhost:5001'; // change if needed

app.use(express.json()); // for parsing application/json bodies
app.use(express.static('public'));        // serves index.html

const FILEMAP_PATH = path.join(__dirname, 'filemap.json');

// Load mapping from disk if exists
let fileMap = {};
if (fs.existsSync(FILEMAP_PATH)) {
  try {
    fileMap = JSON.parse(fs.readFileSync(FILEMAP_PATH, 'utf8'));
  } catch (e) {
    console.error('Failed to load filemap.json:', e);
  }
}

// Helper to save mapping to disk
function saveFileMap() {
  fs.writeFileSync(FILEMAP_PATH, JSON.stringify(fileMap, null, 2));
}

// List all files endpoint
app.get('/files', (req, res) => {
  // Build a list of files with CID, filename, and (optionally) file size and upload date
  const files = Object.entries(fileMap).map(([cid, name]) => ({
    cid,
    name
    // You can add more metadata here if you store it on upload
  }));
  res.json(files);
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { buffer, originalname } = req.file;
    const form = new (require('form-data'))();
    form.append('file', buffer, originalname);

    const response = await axios.post(
      `${IPFS_API}/api/v0/add?pin=true&wrap-with-directory=true`,
      form,
      { headers: form.getHeaders(), responseType: 'text' }
    );

    // Parse each line as JSON, find the file and directory entries
    const lines = response.data.trim().split('\n');
    let fileCid = null, dirCid = null;
    for (const line of lines) {
      const obj = JSON.parse(line);
      if (obj.Name === originalname) fileCid = obj.Hash;
      if (obj.Name === "") dirCid = obj.Hash;
    }

    if (!fileCid) return res.status(500).json({ error: 'CID not found' });
    fileMap[fileCid] = originalname; // Store mapping
    saveFileMap(); // <-- add this line
    res.json({ fileCid, dirCid, name: originalname });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Download endpoint
app.get('/download/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const url = `${IPFS_API}/api/v0/cat?arg=${cid}`;
    const response = await axios.post(url, null, { responseType: 'stream' });
    const filename = fileMap[cid] || cid;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    response.data.pipe(res);
  } catch (e) {
    res.status(404).send('File not found');
  }
});

// Pin a file
app.post('/pin/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    await axios.post(`${IPFS_API}/api/v0/pin/add?arg=${cid}`);
    res.json({ pinned: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unpin a file
app.delete('/pin/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    await axios.post(`${IPFS_API}/api/v0/pin/rm?arg=${cid}`);
    res.json({ pinned: false });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List directory contents
app.get('/ls/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const response = await axios.post(`${IPFS_API}/api/v0/ls?arg=${cid}`);
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get node ID
app.get('/node/id', async (req, res) => {
  try {
    const response = await axios.post(`${IPFS_API}/api/v0/id`);
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List peers
app.get('/swarm/peers', async (req, res) => {
  try {
    const response = await axios.post(`${IPFS_API}/api/v0/swarm/peers`);
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get repo stats
app.get('/stats/repo', async (req, res) => {
  try {
    const response = await axios.post(`${IPFS_API}/api/v0/stats/repo`);
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get version
app.get('/version', async (req, res) => {
  try {
    const response = await axios.post(`${IPFS_API}/api/v0/version`);
    res.json(response.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web app running on http://localhost:${PORT}`));
