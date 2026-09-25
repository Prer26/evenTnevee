import { Router } from "express";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { requireAuth } from "../auth.js";
import { uploadLimiter } from "../rateLimiters.js";
import storage from "../storage.js";

// Client-reported MIME type and filename extension are attacker-controlled.
// We buffer the file in memory first, inspect actual magic bytes, and derive
// the safe extension and content type strictly from verified file bytes.
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB per photo

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

const router = Router();

/**
 * POST /api/uploads/photo
 * Authenticated vendor photo upload to persistent object storage.
 * - Authenticated user required.
 * - 5MB maximum file size.
 * - Real magic-byte validation (JPEG, PNG, WebP, GIF).
 * - Client filename completely discarded (prevents path traversal).
 * - Stored in persistent object storage (never on local disk).
 */
router.post("/photo", requireAuth, uploadLimiter, (req, res) => {
  upload.single("photo")(req, res, async (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 5MB)" : err.message || "Upload failed";
      return res.status(400).json({ message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No photo was sent" });
    }

    // Inspect real file type from magic bytes
    const detected = await fileTypeFromBuffer(req.file.buffer);
    const ext = detected && ALLOWED_TYPES.get(detected.mime);
    if (!ext) {
      return res.status(400).json({
        message: "That doesn't look like a valid JPEG, PNG, WEBP, or GIF image.",
      });
    }

    try {
      // Upload directly to persistent object storage
      const result = await storage.uploadFile({
        buffer: req.file.buffer,
        mimeType: detected.mime,
        extension: ext,
        userId: req.auth.sub,
        category: "portfolio",
      });

      return res.status(201).json({ url: result.url, key: result.key });
    } catch (uploadErr) {
      console.error("Photo upload failed:", uploadErr?.message || uploadErr);
      return res.status(uploadErr.statusCode || 500).json({
        message: uploadErr.message || "Failed to upload image to storage service",
      });
    }
  });
});

export default router;
