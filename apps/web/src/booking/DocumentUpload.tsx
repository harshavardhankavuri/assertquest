import { useState, type ChangeEvent } from "react";
import type { CustomsDocumentMeta } from "@assertquest/shared";
import { Alert } from "../ui/index.js";
import { api, ApiRequestError } from "../lib/api.js";

interface DocumentUploadProps {
  shipmentId: string;
  accessToken: string;
}

// Customs document upload (FR-705). Client-side accept="" hints the browser's file
// picker for UX only — the server enforces the real type/size limits, since a client
// check is trivially bypassable.
export function DocumentUpload({ shipmentId, accessToken }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<CustomsDocumentMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const res = await api.uploadDocument(shipmentId, file, accessToken);
      setDocuments((prev) => [...prev, res.document]);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not upload the document.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-1.5">
      <label htmlFor="customs-document" className="text-xs font-medium uppercase tracking-wide text-muted">
        Upload customs document (PDF, JPG, or PNG, up to 5MB)
      </label>
      <div className="rounded-lg border-2 border-dashed border-hairline p-4 text-center">
        <input
          id="customs-document"
          name="customs-document"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          disabled={uploading}
          onChange={onFileChange}
          className="text-sm text-ink-700 file:mr-3 file:rounded-lg file:border file:border-hairline file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink-600 hover:file:bg-surface-subtle"
        />
      </div>
      {error && (
        <div className="mt-2">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {documents.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {documents.map((doc) => (
            <li key={doc.id} className="font-mono text-xs text-faint">
              {doc.filename} ({doc.mimeType}, {doc.sizeBytes} bytes)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
