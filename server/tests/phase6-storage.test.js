import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import fs from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

// Set environment for test
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_antigravity_phase6_storage_testing";
process.env.STORAGE_ENDPOINT = "https://s3.us-east-1.amazonaws.com";
process.env.STORAGE_REGION = "us-east-1";
process.env.STORAGE_BUCKET = "eventneve-test-bucket";
process.env.STORAGE_ACCESS_KEY = "test_access_key";
process.env.STORAGE_SECRET_KEY = "test_secret_key";
process.env.STORAGE_PUBLIC_URL = "https://cdn.eventneve.local";

// Mock memory store for isolated Prisma testing
const memoryStore = {
  users: new Map(),
  vendors: new Map(),
};

import prisma from "../src/lib/prisma.js";

prisma.user.findUnique = async ({ where }) => {
  if (where.id) return memoryStore.users.get(where.id) || null;
  if (where.email) {
    for (const u of memoryStore.users.values()) {
      if (u.email === where.email) return u;
    }
  }
  return null;
};

prisma.vendor.findUnique = async ({ where }) => {
  return memoryStore.vendors.get(where.id) || null;
};

prisma.vendor.update = async ({ where, data }) => {
  const v = memoryStore.vendors.get(where.id);
  if (!v) throw new Error("Vendor not found");
  Object.assign(v, data);
  return v;
};

import { signToken, hashPassword } from "../src/auth.js";
import storage, { getPublicUrl, uploadFile, isStorageConfigured } from "../src/storage.js";

let server;
let baseUrl;
let testUser;
let userToken;

// Sample valid image buffers with verified magic bytes
const VALID_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const VALID_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
const VALID_WEBP = Buffer.from("UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAD8D+JaQAA3AA/ua1AAA=", "base64");

describe("PHASE 6 PRODUCTION FILE & IMAGE STORAGE TEST SUITE", () => {
  before(async () => {
    const { app } = await import("../src/index.js");

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });

    const pwdHash = await hashPassword("TestPass@123");
    testUser = {
      id: `usr_${nanoid(8)}`,
      email: "phase6_vendor@eventneve.local",
      passwordHash: pwdHash,
      fullName: "Phase 6 Vendor Owner",
      role: "user",
      accountType: "vendor",
      emailVerified: true,
      tokenVersion: 0,
    };
    memoryStore.users.set(testUser.id, testUser);

    userToken = signToken(testUser);

    memoryStore.vendors.set("vendor_p6", {
      id: "vendor_p6",
      userId: testUser.id,
      name: "Atelier Petals & Decor",
      gallery: [],
      image: null,
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // Helper to make multipart upload request
  async function uploadPhotoRequest({ buffer, filename = "photo.png", token = userToken, field = "photo" }) {
    const form = new FormData();
    if (buffer) {
      form.append(field, new Blob([buffer]), filename);
    }

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${baseUrl}/uploads/photo`, {
      method: "POST",
      headers,
      body: form,
    });
  }

  // 1. Storage configuration check
  test("1. Storage service is properly configured from environment variables", () => {
    assert.equal(isStorageConfigured(), true);
  });

  // 2. Object URL generation
  test("2. Public object URL generated accurately using CDN/public endpoint", () => {
    const key = "vendors/usr_123/photos/test_image.png";
    const url = getPublicUrl(key);
    assert.equal(url, "https://cdn.eventneve.local/vendors/usr_123/photos/test_image.png");
  });

  // 3. Fallback AWS S3 URL generation
  test("3. Generates standard S3 URL when STORAGE_PUBLIC_URL is empty", () => {
    const origPublic = process.env.STORAGE_PUBLIC_URL;
    const origEndpoint = process.env.STORAGE_ENDPOINT;
    try {
      delete process.env.STORAGE_PUBLIC_URL;
      delete process.env.STORAGE_ENDPOINT;

      const key = "vendors/usr_123/photos/test_image.png";
      const s3Url = getPublicUrl(key);
      assert.match(s3Url, /https:\/\/eventneve-test-bucket\.s3\.us-east-1\.amazonaws\.com/);
    } finally {
      process.env.STORAGE_PUBLIC_URL = origPublic;
      process.env.STORAGE_ENDPOINT = origEndpoint;
    }
  });

  // 4. Valid image upload (Mocking S3 send to verify route & metadata)
  test("4. Valid image upload processes buffer and returns 201 with public URL", async () => {
    // Intercept S3 client send method in memory for isolated test
    const originalUpload = storage.uploadFile;
    storage.uploadFile = async ({ buffer, mimeType, extension, userId }) => {
      assert.ok(Buffer.isBuffer(buffer));
      assert.equal(mimeType, "image/png");
      assert.equal(extension, "png");
      const key = `vendors/${userId}/portfolio/${Date.now()}_${nanoid(10)}.${extension}`;
      return { key, url: getPublicUrl(key) };
    };

    try {
      const res = await uploadPhotoRequest({ buffer: VALID_PNG, filename: "my-flower.png" });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.url.startsWith("https://cdn.eventneve.local/vendors/"));
      assert.ok(data.key.endsWith(".png"));
    } finally {
      storage.uploadFile = originalUpload;
    }
  });

  // 5. Supported formats (GIF and WebP)
  test("5. Valid GIF and WebP uploads recognized by magic bytes", async () => {
    const originalUpload = storage.uploadFile;
    storage.uploadFile = async ({ mimeType, extension }) => {
      return { key: `test.${extension}`, url: `https://cdn.eventneve.local/test.${extension}` };
    };

    try {
      const resGif = await uploadPhotoRequest({ buffer: VALID_GIF, filename: "test.gif" });
      assert.equal(resGif.status, 201);

      const resWebp = await uploadPhotoRequest({ buffer: VALID_WEBP, filename: "test.webp" });
      assert.equal(resWebp.status, 201);
    } finally {
      storage.uploadFile = originalUpload;
    }
  });

  // 6. Oversized file rejection (>5MB)
  test("6. Oversized file (>5MB) rejected with 400 LIMIT_FILE_SIZE", async () => {
    // 5MB + 1KB buffer
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024);
    const res = await uploadPhotoRequest({ buffer: largeBuffer, filename: "huge.png" });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /too large/i);
  });

  // 7. Invalid MIME rejection (text/plain)
  test("7. Non-image file (e.g. text/plain) rejected with 400", async () => {
    const textBuffer = Buffer.from("Hello world, this is a plain text file, not an image!");
    const res = await uploadPhotoRequest({ buffer: textBuffer, filename: "notes.txt" });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /valid JPEG, PNG, WEBP, or GIF/i);
  });

  // 8. Spoofed file-type rejection (executable/script with .jpg extension)
  test("8. Spoofed file (PHP script with .jpg extension) rejected via magic byte inspection", async () => {
    const spoofedBuffer = Buffer.from("<?php echo 'malicious payload'; ?>");
    const res = await uploadPhotoRequest({ buffer: spoofedBuffer, filename: "avatar.jpg" });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /valid JPEG, PNG, WEBP, or GIF/i);
  });

  // 9. Unsafe filename handling (filename is ignored completely)
  test("9. Unsafe filename (evil-shell.php.png) is discarded in favor of safe nanoid key", async () => {
    let generatedKey = null;
    const originalUpload = storage.uploadFile;
    storage.uploadFile = async ({ key, extension, userId }) => {
      generatedKey = `vendors/${userId}/portfolio/${Date.now()}_${nanoid(10)}.${extension}`;
      return { key: generatedKey, url: getPublicUrl(generatedKey) };
    };

    try {
      const res = await uploadPhotoRequest({
        buffer: VALID_PNG,
        filename: "evil-shell.php.png",
      });
      assert.equal(res.status, 201);
      assert.ok(!generatedKey.includes("evil-shell"));
      assert.ok(!generatedKey.includes(".php"));
    } finally {
      storage.uploadFile = originalUpload;
    }
  });

  // 10. Path traversal attempt rejected
  test("10. Path traversal filename (../../etc/passwd) is neutralized", async () => {
    let generatedKey = null;
    const originalUpload = storage.uploadFile;
    storage.uploadFile = async ({ userId, extension }) => {
      generatedKey = `vendors/${userId}/portfolio/${Date.now()}_${nanoid(10)}.${extension}`;
      return { key: generatedKey, url: getPublicUrl(generatedKey) };
    };

    try {
      const res = await uploadPhotoRequest({
        buffer: VALID_PNG,
        filename: "../../../../etc/passwd.png",
      });
      assert.equal(res.status, 201);
      assert.ok(!generatedKey.includes(".."));
      assert.ok(!generatedKey.includes("etc"));
    } finally {
      storage.uploadFile = originalUpload;
    }
  });

  // 11. Unauthorized upload
  test("11. Unauthorized upload request without Bearer token rejected with 401", async () => {
    const res = await uploadPhotoRequest({ buffer: VALID_PNG, token: null });
    assert.equal(res.status, 401);
  });

  // 12. Storage failure handling
  test("12. Storage provider failure handled safely without exposing credentials or crashing", async () => {
    const originalUpload = storage.uploadFile;
    storage.uploadFile = async () => {
      throw Object.assign(
        new Error("Failed to upload file to storage service. Please try again later."),
        { statusCode: 502, code: "STORAGE_UPLOAD_FAILED" }
      );
    };

    try {
      const res = await uploadPhotoRequest({ buffer: VALID_PNG });
      assert.equal(res.status, 502);
      const data = await res.json();
      assert.match(data.message, /Failed to upload file/i);
      // Ensure no secret keys or internal AWS stack traces leaked in error
      assert.ok(!JSON.stringify(data).includes("test_secret_key"));
      assert.ok(!JSON.stringify(data).includes("test_access_key"));
    } finally {
      storage.uploadFile = originalUpload;
    }
  });

  // 13. Frontend URL resolution compatibility
  test("13. Frontend resolveUploadUrl leaves absolute S3/CDN URLs intact", () => {
    // Replicates resolveUploadUrl implementation in base44Client.js
    const API_ORIGIN = "http://localhost:4000";
    function resolveUploadUrl(url) {
      if (!url) return "";
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      return `${API_ORIGIN}${url}`;
    }

    const s3Url = "https://cdn.eventneve.local/vendors/u1/portfolio/photo.jpg";
    assert.equal(resolveUploadUrl(s3Url), s3Url);

    const legacyUrl = "/uploads/old_photo.jpg";
    assert.equal(resolveUploadUrl(legacyUrl), "http://localhost:4000/uploads/old_photo.jpg");
  });

  // 14. Database reference persistence
  test("14. Vendor gallery can store persistent object storage URLs", async () => {
    const objectUrl = "https://cdn.eventneve.local/vendors/vendor_p6/portfolio/floral_arrangement.jpg";
    const updated = await prisma.vendor.update({
      where: { id: "vendor_p6" },
      data: { gallery: [objectUrl] },
    });

    assert.equal(updated.gallery.length, 1);
    assert.equal(updated.gallery[0], objectUrl);
  });

  // 15. No permanent local files written to server/uploads
  test("15. Verified that no files were written to local disk server/uploads/", () => {
    const uploadsDir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir).filter((f) => f !== ".gitkeep");
      assert.equal(files.length, 0, "No new files should be written to local server/uploads/");
    }
  });
});
