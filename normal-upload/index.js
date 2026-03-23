import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs';

const PORT = 3000;
const HOST = 'http://localhost'
const MB_10 = 10 * 1024 * 1024

const basePath = process.cwd();
const uploadPath = path.join(basePath, 'uploads/');
if(!fs.existsSync(uploadPath)) {
	fs.mkdirSync(uploadPath, { recursive: true })
}


const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const multerDiskStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadPath)
	},
	filename: (req, file, cb) => {
	    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
	    const ext = path.extname(file.originalname);

	    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
    }
})

const uploader = multer({ 
	storage: multerDiskStorage,
	limits: {
		fileSize: MB_10
	}
});

app.post('/upload', uploader.single('file'),(req, res) => {
	if(! req.file) return;

	res.json({success:true, message: 'success', file: { name: req.file.filename, path: getFilePath(req.file.path) }});
})

app.post('/unlink', (req, res) => {
	const pathname = new URL(req.body.filePath).pathname;

    const relativePath = pathname.replace(/^\/+/, '');

    const filePath = path.join(basePath, relativePath);

	fs.unlink(filePath, err => {
		if(err) {
			return res.status(500).json({
                success: false,
                message: 'File not found or already deleted'
            });
		}

		res.json({
            success: true,
            message: 'File deleted'
        });
	})
})

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `File size exceeded ${bytesToMB(MB_10)} MB`
      });
    }
  }

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
	console.log("App is running on port", PORT)
})

function getFilePath(filePath) {
	return `${HOST}:${PORT}/${path.relative(basePath, filePath)}`;
}

export const bytesToMB = (bytes) => {
  return bytes / (1024 * 1024);
};