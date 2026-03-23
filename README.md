# File Upload with JavaScript

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Multer](https://img.shields.io/badge/Multer-FF6B35?style=for-the-badge&logo=multer&logoColor=white)](https://github.com/expressjs/multer)

A comprehensive file upload project demonstrating two different approaches for handling file uploads in JavaScript: normal file upload and chunked file upload for large files.

## Features

### Normal Upload

- **Drag & Drop Interface**: Intuitive drag-and-drop file upload area
- **File Preview**: Visual preview of uploaded files
- **File Deletion**: Remove uploaded files from server
- **File Size Limit**: 10MB maximum file size restriction
- **Real-time Feedback**: Success/error messages for upload operations

### Chunk Upload

- **Large File Support**: Upload files larger than memory limits by splitting into chunks
- **Progress Tracking**: Real-time upload progress with percentage completion
- **Resume/Pause Capability**: Cancel and restart uploads
- **Chunk Management**: Automatic chunk merging on server-side
- **Status Monitoring**: Check upload progress and completion status
- **Memory Efficient**: Uses memory storage for chunks before merging

## Project Structure

```
file-upload-with-javascript/
├── README.md
├── chunk-upload/
│   ├── index.js                 # Express server for chunked uploads
│   ├── package.json             # Dependencies and scripts
│   └── public/
│       ├── index.html           # Frontend for chunk upload
│       └── uploads/
│           └── chunks/          # Temporary chunk storage
└── normal-upload/
    ├── index.js                 # Express server for normal uploads
    ├── package.json             # Dependencies and scripts
    └── public/
        ├── index.html           # Frontend for normal upload
        └── uploads/             # Final uploaded files storage
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd file-upload-with-javascript
    ```

2. **Install dependencies for Normal Upload:**

    ```bash
    cd normal-upload
    npm install
    ```

3. **Install dependencies for Chunk Upload:**
    ```bash
    cd ../chunk-upload
    npm install
    ```

## Usage

### Running the Normal Upload Server

```bash
cd normal-upload
npm run dev
```

Server will start on `http://localhost:3000`

### Running the Chunk Upload Server

```bash
cd chunk-upload
npm run dev
```

Server will start on `http://localhost:3000`

> **Note:** Both servers run on the same port by default. To run both simultaneously, modify the `PORT` variable in one of the `index.js` files (e.g., change chunk-upload to port 3001).

### API Endpoints

#### Normal Upload

- `POST /upload` - Upload a single file
- `POST /unlink` - Delete an uploaded file

#### Chunk Upload

- `POST /upload` - Upload a file chunk
- `GET /upload/status` - Check upload progress
- `POST /upload/cancel` - Cancel an ongoing upload
- `POST /unlink` - Delete a merged file

## Technologies Used

- **Backend:**
    - [Express.js](https://expressjs.com/) - Web framework for Node.js
    - [Multer](https://github.com/expressjs/multer) - Middleware for handling file uploads

- **Frontend:**
    - Vanilla JavaScript
    - HTML5 Drag & Drop API
    - CSS3 for styling

- **File System:**
    - Node.js `fs` module for file operations
    - Chunk-based file handling for large uploads

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both upload implementations
5. Submit a pull request

## License

This project is licensed under the ISC License.
