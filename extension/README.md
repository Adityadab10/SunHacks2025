# Study Extension

A Chrome extension built with Plasmo, React, and TailwindCSS for summarizing YouTube videos and PDF documents, with an integrated notes workspace.

## Features

### 🎥 YouTube Summary
- Automatically detects when you're on a YouTube page
- Summarizes video content using your custom API
- Save summaries to your personal notes collection

### 📄 PDF Summary  
- Upload PDF files directly in the extension
- Get structured summaries of PDF content
- Support for files up to 10MB

### 📝 Notes Workspace
- View all saved summaries in one place
- Organize notes by type (YouTube/PDF) and date
- Export all notes to a text file
- Delete individual notes
- Quick access to original sources

## Tech Stack

- **Framework**: Plasmo (Manifest V3)
- **Frontend**: React + TypeScript
- **Styling**: TailwindCSS
- **Icons**: Custom SVG icons
- **Storage**: Chrome Storage API

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- pnpm package manager
- Chrome browser

### Installation

1. **Clone and navigate to the extension directory**:
   ```bash
   cd extension
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API base URL:
   ```
   PLASMO_PUBLIC_API_URL=http://localhost:3001
   ```

### Development

1. **Start development server**:
   ```bash
   pnpm dev
   ```

2. **Load extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder

3. **The extension will automatically reload when you make changes**

### Production Build

1. **Build the extension**:
   ```bash
   pnpm build
   ```

2. **Package for distribution** (optional):
   ```bash
   pnpm package
   ```

3. **Load the production build**:
   - Use the `build/chrome-mv3-prod` folder
   - Or use the generated `.zip` file from the package command

## Usage

### YouTube Summarization
1. Navigate to any YouTube video
2. Click the extension icon
3. Go to the "YouTube" tab
4. Click "Summarize YouTube Video"
5. Save the summary to your notes if desired

### PDF Summarization
1. Click the extension icon
2. Go to the "PDF" tab
3. Upload a PDF file (drag & drop or click to browse)
4. Click "Summarize PDF"
5. Save the summary to your notes if desired

### Managing Notes
1. Click the extension icon
2. Go to the "Notes" tab
3. View all your saved summaries
4. Export all notes to a text file
5. Delete individual notes
6. Click external link icons to revisit sources

## API Integration

The extension expects your backend API to have these endpoints:

### YouTube Summary
```
POST /summarize/youtube
Content-Type: application/json

Request:
{
  "videoUrl": "https://youtube.com/watch?v=..."
}

Response:
{
  "summary": "Video summary text...",
  "title": "Video Title",
  "videoId": "video_id"
}
```

### PDF Summary
```
POST /summarize/pdf
Content-Type: multipart/form-data

Request:
- file: PDF file

Response:
{
  "summary": "PDF summary text...",
  "filename": "document.pdf"
}
```

## Project Structure

```
extension/
├── components/           # React components
│   ├── Icons.tsx        # Custom SVG icons
│   ├── YouTubeSummary.tsx
│   ├── PdfSummary.tsx
│   └── NotesWorkspace.tsx
├── utils/               # Utility functions
│   ├── api.ts          # API client
│   └── storage.ts      # Chrome storage management
├── popup.tsx           # Main popup component
├── content.tsx         # Content script
├── background.ts       # Background service worker
├── types.ts           # TypeScript definitions
├── style.css          # Global styles
├── .env.example       # Environment variables template
└── # Study Extension

A Chrome extension built with Plasmo, React, and TailwindCSS for summarizing YouTube videos and PDF documents, with an integrated notes workspace.

## Features

### 🎥 YouTube Summary
- Automatically detects when you're on a YouTube page
- Summarizes video content using your custom API
- Save summaries to your personal notes collection

### 📄 PDF Summary  
- Upload PDF files directly in the extension
- Get structured summaries of PDF content
- Support for files up to 10MB

### 📝 Notes Workspace
- View all saved summaries in one place
- Organize notes by type (YouTube/PDF) and date
- Export all notes to a text file
- Delete individual notes
- Quick access to original sources

## Tech Stack

- **Framework**: Plasmo (Manifest V3)
- **Frontend**: React + TypeScript
- **Styling**: TailwindCSS
- **Icons**: Custom SVG icons
- **Storage**: Chrome Storage API

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- pnpm package manager
- Chrome browser

### Installation

1. **Clone and navigate to the extension directory**:
   ```bash
   cd extension
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your API base URL:
   ```
   PLASMO_PUBLIC_API_URL=http://localhost:3001
   ```

### Development

1. **Start development server**:
   ```bash
   pnpm dev
   ```

2. **Load extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder

3. **The extension will automatically reload when you make changes**

### Production Build

1. **Build the extension**:
   ```bash
   pnpm build
   ```

2. **Package for distribution** (optional):
   ```bash
   pnpm package
   ```

3. **Load the production build**:
   - Use the `build/chrome-mv3-prod` folder
   - Or use the generated `.zip` file from the package command

## Usage

### YouTube Summarization
1. Navigate to any YouTube video
2. Click the extension icon
3. Go to the "YouTube" tab
4. Click "Summarize YouTube Video"
5. Save the summary to your notes if desired

### PDF Summarization
1. Click the extension icon
2. Go to the "PDF" tab
3. Upload a PDF file (drag & drop or click to browse)
4. Click "Summarize PDF"
5. Save the summary to your notes if desired

### Managing Notes
1. Click the extension icon
2. Go to the "Notes" tab
3. View all your saved summaries
4. Export all notes to a text file
5. Delete individual notes
6. Click external link icons to revisit sources

## API Integration

The extension expects your backend API to have these endpoints:

### YouTube Summary
```
POST /summarize/youtube
Content-Type: application/json

Request:
{
  "videoUrl": "https://youtube.com/watch?v=..."
}

Response:
{
  "summary": "Video summary text...",
  "title": "Video Title",
  "videoId": "video_id"
}
```

### PDF Summary
```
POST /summarize/pdf
Content-Type: multipart/form-data

Request:
- file: PDF file

Response:
{
  "summary": "PDF summary text...",
  "filename": "document.pdf"
}
```

## Project Structure

```
extension/
├── components/           # React components
│   ├── Icons.tsx        # Custom SVG icons
│   ├── YouTubeSummary.tsx
│   ├── PdfSummary.tsx
│   └── NotesWorkspace.tsx
├── utils/               # Utility functions
│   ├── api.ts          # API client
│   └── storage.ts      # Chrome storage management
├── popup.tsx           # Main popup component
├── content.tsx         # Content script
├── background.ts       # Background service worker
├── types.ts           # TypeScript definitions
├── style.css          # Global styles
├── .env.example       # Environment variables template
└── README.md          # This file
```

## Chrome Extension Permissions

The extension requires these permissions:
- `activeTab`: Access current tab information
- `storage`: Save notes locally
- `tabs`: Detect YouTube pages and manage tabs
- `host_permissions`: Make API calls to your backend

## Troubleshooting

### Extension not loading
- Make sure you're loading the correct build folder
- Check the Chrome console for errors
- Verify all required permissions are granted

### API calls failing
- Check your `.env` file has the correct API URL
- Ensure your backend server is running
- Check browser console for network errors
- Verify CORS settings on your backend

### YouTube detection not working
- Make sure you're on a valid YouTube video page
- The extension detects `youtube.com` and `youtu.be` URLs
- Try refreshing the page

### Storage issues
- Check if Chrome storage quota is exceeded
- Clear extension data in Chrome settings if needed
- Verify storage permissions are granted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.md          # This file
```

## Chrome Extension Permissions

The extension requires these permissions:
- `activeTab`: Access current tab information
- `storage`: Save notes locally
- `tabs`: Detect YouTube pages and manage tabs
- `host_permissions`: Make API calls to your backend

## Troubleshooting

### Extension not loading
- Make sure you're loading the correct build folder
- Check the Chrome console for errors
- Verify all required permissions are granted

### API calls failing
- Check your `.env` file has the correct API URL
- Ensure your backend server is running
- Check browser console for network errors
- Verify CORS settings on your backend

### YouTube detection not working
- Make sure you're on a valid YouTube video page
- The extension detects `youtube.com` and `youtu.be` URLs
- Try refreshing the page

### Storage issues
- Check if Chrome storage quota is exceeded
- Clear extension data in Chrome settings if needed
- Verify storage permissions are granted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!
