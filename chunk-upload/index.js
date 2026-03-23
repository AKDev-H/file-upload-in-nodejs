import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const PORT = 3000;
const HOST = "http://localhost";

const basePath = process.cwd();
const uploadPath = path.join(basePath, "uploads/");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const uploader = multer({
    storage: multer.memoryStorage(),
});

app.post("/upload", uploader.single("chunk"), (req, res) => {
    try {
        const {
            fileId,
            chunkIndex,
            totalChunks,
            fileName,
            fileSize,
            lastModified,
        } = req.body;
        let merged = false;

        if (!fileId || chunkIndex === undefined) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const chunkDir = path.join(basePath, "uploads", "chunks", fileId);

        if (!fs.existsSync(chunkDir)) {
            fs.mkdirSync(chunkDir, { recursive: true });
        }

        const metadataPath = path.join(chunkDir, "metadata.json");
        if (!fs.existsSync(metadataPath) && totalChunks) {
            fs.writeFileSync(
                metadataPath,
                JSON.stringify(
                    {
                        fileName,
                        fileSize: parseInt(fileSize) || 0,
                        totalChunks: parseInt(totalChunks),
                        lastModified: lastModified || null,
                        createdAt: Date.now(),
                    },
                    null,
                    2,
                ),
            );
        }

        const chunkPath = path.join(chunkDir, chunkIndex);

        fs.writeFileSync(chunkPath, req.file.buffer);

        const uniqueFileName = generateFileName(fileName);

        if (readyToMergeChunks(chunkDir, totalChunks)) {
            merged = mergeChunks(fileId, uniqueFileName, totalChunks);
        }

        res.json({
            success: true,
            file: {
                name: fileName,
                size: fileSize,
                url: getFilePath(path.join(uploadPath, uniqueFileName)),
            },
            done: merged,
        });
    } catch (err) {
        throw err;
    }
});

app.get("/upload/status", (req, res) => {
    const { fileId } = req.query;

    if (!fileId) {
        return res
            .status(400)
            .json({ success: false, error: "fileId is required" });
    }

    const chunkDir = path.join(basePath, "uploads", "chunks", fileId);

    if (!fs.existsSync(chunkDir)) {
        return res.json({
            success: true,
            uploadedChunks: 0,
            totalChunks: null, // we don't know yet
            fileName: null,
            done: false,
        });
    }

    try {
        const files = fs.readdirSync(chunkDir);
        const chunkNumbers = files
            .map((f) => parseInt(f, 10))
            .filter((n) => !isNaN(n) && Number.isInteger(n));

        const maxChunk =
            chunkNumbers.length > 0 ? Math.max(...chunkNumbers) : -1;
        const uploadedCount = chunkNumbers.length;

        let totalChunks = null;
        const metadataPath = path.join(chunkDir, "metadata.json");

        if (fs.existsSync(metadataPath)) {
            try {
                const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
                totalChunks = meta.totalChunks;
            } catch {}
        }

        // If we have all chunks → consider it done (even if merge not yet triggered)
        const isDone = totalChunks !== null && uploadedCount >= totalChunks;

        res.json({
            success: true,
            uploadedChunks: uploadedCount,
            // highest consecutive? but for simplicity we just send count
            // (you can improve later to find gaps)
            totalChunks,
            fileName: null, // optional – can add if you store it
            done: isDone,
            progress: totalChunks
                ? Math.floor((uploadedCount / totalChunks) * 100)
                : 0,
        });
    } catch (err) {
        console.error("Status error:", err);
        res.status(500).json({
            success: false,
            error: "Cannot read chunk directory",
        });
    }
});

app.post("/unlink", (req, res) => {
    const pathname = new URL(req.body.filePath).pathname;

    const relativePath = pathname.replace(/^\/+/, "");

    const filePath = path.join(basePath, relativePath);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "File not found or already deleted",
            });
        }

        res.json({
            success: true,
            message: "File deleted",
        });
    });
});

app.post("/upload/cancel", (req, res) => {
    const { fileId } = req.body;

    if (!fileId) {
        return res
            .status(400)
            .json({ success: false, error: "fileId is required" });
    }

    const chunkDir = path.join(basePath, "uploads", "chunks", fileId);

    if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true });
    }

    res.json({
        success: true,
        message: "Chunks cleared",
    });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: `File size exceeded ${bytesToMB(MB_10)} MB`,
            });
        }
    }

    return res.status(500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

app.listen(PORT, () => {
    console.log("App is running on port", PORT);
});

const getFilePath = (filePath) => {
    return `${HOST}:${PORT}/${path.relative(basePath, filePath)}`;
};

const bytesToMB = (bytes) => {
    return bytes / (1024 * 1024);
};

const generateFileName = (fileName) => {
    const ext = path.extname(fileName);
    const name = path.basename(fileName);

    return `${name}-${Date.now()}.${ext}`;
};

const mergeChunks = (fileId, fileName, totalChunks) => {
    try {
        const chunkDir = path.join(basePath, "uploads", "chunks", fileId);
        const outputPath = path.join(basePath, "uploads", fileName);

        const writeStream = fs.createWriteStream(outputPath);

        for (let i = 0; i < totalChunks; i++) {
            const chunkPath = path.join(chunkDir, String(i));

            if (!fs.existsSync(chunkPath)) {
                throw new Error(`Missing chunk ${i}`);
            }

            const data = fs.readFileSync(chunkPath);
            writeStream.write(data);
        }

        writeStream.end();

        writeStream.on("finish", () => {
            console.log("Merge complete");

            fs.rmSync(chunkDir, { recursive: true, force: true });
        });

        return true;
    } catch (err) {
        throw err;
    }
};

const readyToMergeChunks = (chunkDir, totalChunks) => {
    for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(chunkDir, String(i));
        if (!fs.existsSync(chunkPath)) {
            return false;
        }
    }
    return true;
};
