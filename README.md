# MP4 to MP3 Converter

A small web app that converts an uploaded MP4 video into an MP3 audio file. Built with Node.js, Express and ffmpeg, with a Bootstrap frontend.

## Features

- Upload an MP4 file and download its audio as an **MP3** (192 kbps)
- Progress spinner and on-page error messages
- Downloads are named after the original file
- Only MP4 files are accepted, with a 600 MB size limit
- Temporary files are deleted automatically after each request

## Tech stack

- **Backend:** Node.js, Express, Multer (file uploads), fluent-ffmpeg
- **Tools:** ffmpeg
- **Frontend:** HTML, JavaScript (`fetch`), Bootstrap 5

## Project structure

```
.
├── convert.js        # Express server and conversion logic
├── package.json
├── USAGE_POLICY.md
├── public/
│   ├── index.html    # Page and form
│   └── script.js     # Handles the form, spinner and download
└── uploads/          # Temporary files (created automatically, not tracked in Git)
```

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer (LTS recommended)
- ffmpeg. The `ffmpeg-static` package provides it, but if its download is blocked on your machine, install ffmpeg yourself and make sure it is on your PATH

On Windows:

```powershell
winget install ffmpeg
```

Close and reopen your terminal afterwards so the new program is found.

## Getting started

```bash
# 1. Clone the repo
git clone https://github.com/erklop/mp4-mp3-converter.git
cd mp4-mp3-converter

# 2. Install dependencies
npm install

# 3. Start the server
node convert.js
```

Then open <http://localhost:3000>.

On Windows PowerShell, if `npm` is blocked by the execution policy, use `npm.cmd install` instead, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.

## Usage

1. Choose an MP4 file.
2. Click **Convert to MP3**.
3. The download starts automatically when the conversion finishes.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port the server listens on |

## Troubleshooting

- **"Cannot find ffmpeg"**: install ffmpeg and check that `ffmpeg -version` works in a new terminal.
- **"Only MP4 files are supported"**: choose a file with an `.mp4` extension.
- **Page does nothing when you click the button**: make sure `script.js` is inside the `public` folder and hard-refresh with `Ctrl+F5`.

## Responsible use

Only convert files you own or have permission to use. See [USAGE_POLICY.md](USAGE_POLICY.md) for details.

The app has no authentication or rate limiting, so don't expose it publicly without adding both.

## Possible improvements

- Progress reporting for long conversions
- Support for more input and output formats
- Drag-and-drop uploads
