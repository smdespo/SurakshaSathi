import { useState, useCallback } from "react";
import { extractError } from "../api/client";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per chunk
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

/**
 * Handles video upload of any size.
 *
 * - Single chunk  → POST /reports/public   (your existing endpoint)
 * - Multi  chunk  → POST /upload-chunk  x N, then POST /assemble-and-predict
 *
 * Usage:
 *   const { upload, progress, uploading, error, reset } = useChunkedUpload();
 *   const result = await upload(file, latitude, longitude);
 */
export function useChunkedUpload() {
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(async (file, latitude, longitude) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // ── Single chunk: use existing /reports/public directly ──
      if (totalChunks === 1) {
        const form = new FormData();
        form.append("file",      file);
        form.append("latitude",  String(latitude));
        form.append("longitude", String(longitude));

        const res = await fetch(`${BASE}/reports/public`, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || `Upload failed (HTTP ${res.status})`);
        }

        setProgress(100);
        const result = await res.json();
        return result;
      }

      // ── Multi-chunk: send piece by piece ──
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end   = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const form = new FormData();
        form.append("chunk",        chunk, file.name);
        form.append("upload_id",    uploadId);
        form.append("chunk_index",  String(i));
        form.append("total_chunks", String(totalChunks));
        form.append("filename",     file.name);
        form.append("latitude",     String(latitude));
        form.append("longitude",    String(longitude));

        const res = await fetch(`${BASE}/upload-chunk`, {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || `Chunk ${i + 1}/${totalChunks} failed`);
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 95));
      }

      // ── Assemble + predict ──
      const finalForm = new FormData();
      finalForm.append("upload_id",    uploadId);
      finalForm.append("filename",     file.name);
      finalForm.append("latitude",     String(latitude));
      finalForm.append("longitude",    String(longitude));
      finalForm.append("create_alert", "true");

      const finalRes = await fetch(`${BASE}/assemble-and-predict`, {
        method: "POST",
        body: finalForm,
      });

      if (!finalRes.ok) {
        const data = await finalRes.json().catch(() => ({}));
        throw new Error(data.detail || "Assembly failed");
      }

      setProgress(100);
      return await finalRes.json();

    } catch (err) {
      const msg = extractError(err);
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, progress, uploading, error, reset };
}