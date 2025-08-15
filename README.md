# Web-based File Compressor

A small full-stack project that lets users upload one or more files from a browser, compresses each file server-side using a native C++ compressor binary, and returns a single ZIP containing the compressed outputs. The project includes a simple static frontend (upload + download pages), an Express server to handle uploads and coordinate compression, and a C++ CLI stub (`compressor.cpp`) where you can implement your compression algorithm (Huffman / LZ / DEFLATE etc.).

---

## Table of contents

* [Demo / Elevator pitch](#demo--elevator-pitch)
* [Features](#features)
* [Tech stack](#tech-stack)
* [Project structure](#project-structure)
* [Prerequisites](#prerequisites)
* [Quick start (local)](#quick-start-local)

  * [1. Build compressor (C++)](#1-build-compressor-c)
  * [2. Install server deps](#2-install-server-deps)
  * [3. Run server](#3-run-server)
  * [4. Use the app](#4-use-the-app)
* [API endpoints](#api-endpoints)
* [How compression is invoked](#how-compression-is-invoked)
* [Security & production notes](#security--production-notes)
* [Limitations & roadmap](#limitations--roadmap)
* [Contributing](#contributing)
* [License & contact](#license--contact)

---

## Demo / Elevator pitch

Upload files via a web form → server saves uploads and spawns a native `compressor` executable for each file → server collects compressed outputs and produces a downloadable ZIP. The frontend polls for job completion and then enables download.

---

## Features

* Multi-file upload support
* Server-side compression using a native C++ binary (extensible; current C++ file is a stub)
* Single ZIP download of all compressed outputs
* Progress polling on a download page (ready / not ready)
* Simple, dependency-minimal stack for easy experimentation

---

## Tech stack

* Frontend: plain HTML / CSS / vanilla JavaScript (`index.html`, `download.html`)
* Backend: Node.js + Express, `multer` for multipart uploads, `archiver` for zipping, `child_process` to call the native compressor
* Native: C++ CLI (`compressor.cpp`) — intended for your compression implementation

---

## Project structure (suggested)

```
.
├── compressor.cpp        # C++ compressor (stub) — build to `compressor`
├── index.html            # Upload page
├── download.html         # Polling / download page
├── server.js             # Express server
├── package.json
└── README.md
```

---

## Prerequisites

* Node.js (v14+ recommended) and npm
* g++ or other C++ compiler to build `compressor.cpp`
* Optional: `zip` utility for manual testing

---

## Quick start (local)

### 1. Build compressor (C++)

Compile `compressor.cpp` to a CLI executable named `compressor` (Linux / macOS example):

```bash
g++ -O2 -std=c++17 -o compressor compressor.cpp
```

Windows (MinGW) example:

```bash
g++ -O2 -std=c++17 -o compressor.exe compressor.cpp
```

**Note:** The provided `compressor.cpp` is a placeholder that copies the input to output. Replace with your compression implementation (Huffman, LZ77, etc.) or integrate an existing library.

### 2. Install server dependencies

```bash
npm init -y
npm install express multer archiver
```

### 3. Run server

```bash
node server.js
# By default: listens on PORT 3000 (or process.env.PORT)
```

### 4. Use the app

* Open `http://localhost:3000/index.html`
* Select files and upload
* After upload you are redirected to `download.html?fileId=<id>` which polls the server until the ZIP is ready
* Click the download link to get the ZIP of compressed files

---

## API endpoints (examples)

> These are typical endpoints used by the frontend. Exact paths depend on `server.js` implementation.

* `POST /upload`

  * Accepts multipart form uploads (one or more files). Server returns a JSON `{ fileId: "<id>", redirect: "/download.html?fileId=<id>" }`.

* `GET /check_ready/:fileId`

  * Returns JSON `{ ready: true/false, percent?: number }` so frontend can poll.

* `GET /download_file/:fileId`

  * Streams the ZIP archive of compressed outputs when the job is ready.

---

## How compression is invoked

* For each uploaded file the Node server spawns the compressor executable:

  ```js
  // pseudocode
  execFile('./compressor', [inputPath, outputPath], (err, stdout, stderr) => { ... });
  ```
* The compressor should accept the input path and output path arguments and write compressed output to `outputPath`.
* You can extend the protocol to support progress reporting (stdout lines, temp progress files, or a small socket) to give the frontend per-file progress.

---

## Security & production notes

* **Sandbox the compressor**: Running native code on user uploads is risky. Consider running compression inside a restricted container (Docker, chroot) or as an unprivileged user.
* **Validate uploads**: Enforce file-size limits and allowed mime-types; sanitize filenames before writing to disk or zipping.
* **Virus scanning**: Integrate a virus scanner (ClamAV or hosted scanning) if deploying to production.
* **Persistent job state**: For robustness across server restarts, store job metadata in a persistent store (Redis, DB) and keep compressed outputs in durable storage (S3, block storage).
* **Rate limiting & auth**: Add authentication and rate limits to avoid abuse.
* **Cleanup**: Have a scheduled cleanup for stale `uploads/` and `compressed/` directories.

---

## Limitations & roadmap

* Currently `compressor.cpp` is a placeholder — replace with the actual compression algorithm.
* In-memory job tracking — not resilient to crashes or scaling. Use Redis/DB + queue for production.
* Polling is basic; consider Socket.IO for real-time progress updates.
* No authentication — add if you want users to manage private uploads.

Planned enhancements:

* Implement Huffman or LZ compressor with verification (round-trip decompress).
* Add per-file progress streaming from the C++ binary.
* Dockerize the compressor to run isolated instances per job.
* Add a simple web UI to show history and previews.

---

## Development notes & tips

* When implementing compression, provide an option `--verify` that decompresses the compressed file and compares checksums to ensure integrity.
* To report progress from C++: write periodic JSON lines to stdout like `{"file":"x","percent":42}`; have `server.js` capture and parse stdout and update job state.
* If you prefer an existing compressor, call `gzip` / `7z` / `zstd` instead of a custom binary (but note licensing and dependency differences).

---

## Testing

* Basic tests:

  * Upload a small text file and confirm the ZIP contains a compressed file.
  * Upload a large file and ensure server enforces size limits.
  * Test compressor failure (simulate non-zero exit) — verify server marks job as failed and cleans up.

* Example curl upload:

```bash
curl -F "files=@./sample.txt" http://localhost:3000/upload
```

---

## Contributing

1. Fork the repo
2. Create a feature branch `feature/<name>`
3. Make your changes and add tests (if any)
4. Open a Pull Request explaining the change

If contributing compression code, include:

* Compression algorithm description & complexity
* Decompression verification tests
* Safety checks for malformed inputs

---

## License

Specify your preferred license (e.g., MIT). Example:

```
MIT License
Copyright (c) 2025 Ashish Kumar Panda
```

---

## Contact

* GitHub: [https://github.com/ashish0panda/Web-based-file-compressor](https://github.com/ashish0panda/Web-based-file-compressor)
* Email: [ashish.panda802@gmail.com](mailto:ashish.panda802@gmail.com)

---

Thanks! If you want, I can:

* Generate a `Dockerfile` and `docker-compose.yml` to isolate the compressor in a container, or
* Write a production-ready `server.js` example that uses Redis for job state and Socket.IO for live progress.
