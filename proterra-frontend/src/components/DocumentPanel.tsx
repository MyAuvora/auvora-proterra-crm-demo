import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Upload, FileText, Image, Trash2, Download, Eye,
  File, FileSpreadsheet, X, Plus,
} from "lucide-react";
import { getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl } from "@/lib/api";

interface DocumentItem {
  document_id: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  category: string;
  description: string;
  uploaded_at: string;
}

const CATEGORY_OPTIONS: Record<string, { label: string; color: string }> = {
  contract: { label: "Contract", color: "bg-blue-100 text-blue-700" },
  quote: { label: "Quote", color: "bg-emerald-100 text-emerald-700" },
  design: { label: "Design", color: "bg-violet-100 text-violet-700" },
  photo: { label: "Photo", color: "bg-amber-100 text-amber-700" },
  survey: { label: "Survey", color: "bg-cyan-100 text-cyan-700" },
  permit: { label: "Permit", color: "bg-orange-100 text-orange-700" },
  insurance: { label: "Insurance", color: "bg-rose-100 text-rose-700" },
  render: { label: "3D Render", color: "bg-indigo-100 text-indigo-700" },
  blueprint: { label: "Blueprint", color: "bg-sky-100 text-sky-700" },
  other: { label: "Other", color: "bg-zinc-100 text-zinc-700" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return <Image className="h-5 w-5 text-violet-500" />;
  if (contentType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
  if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType.includes("csv"))
    return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  return <File className="h-5 w-5 text-slate-400" />;
}

interface DocumentPanelProps {
  entityType: "lead" | "project" | "contractor";
  entityId: string;
  categories?: string[];
  title?: string;
}

export default function DocumentPanel({
  entityType,
  entityId,
  categories,
  title = "Documents",
}: DocumentPanelProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploadDescription, setUploadDescription] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = () => {
    getDocuments(entityType, entityId)
      .then((data: DocumentItem[]) => setDocuments(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, [entityType, entityId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(file, entityType, entityId, uploadCategory, uploadDescription);
      loadDocuments();
      setShowUpload(false);
      setUploadCategory("other");
      setUploadDescription("");
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDocument(docId);
      loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (docId: string) => {
    window.open(getDocumentDownloadUrl(docId), "_blank");
  };

  const handlePreview = (doc: DocumentItem) => {
    if (doc.content_type.startsWith("image/") || doc.content_type === "application/pdf") {
      setPreviewDoc(doc);
    } else {
      handleDownload(doc.document_id);
    }
  };

  const filteredDocs = categories
    ? documents.filter((d) => categories.includes(d.category))
    : documents;

  const availableCategories = categories
    ? categories
    : Object.keys(CATEGORY_OPTIONS);

  return (
    <>
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sky-600" />
              <CardTitle className="text-lg">{title}</CardTitle>
              {filteredDocs.length > 0 && (
                <Badge variant="secondary" className="text-xs">{filteredDocs.length}</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpload(!showUpload)}
              className="gap-1.5"
            >
              {showUpload ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showUpload ? "Cancel" : "Upload"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Upload Form */}
          {showUpload && (
            <div className="mb-4 p-4 rounded-lg bg-slate-50 border border-dashed border-slate-300 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="h-8 text-sm"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_OPTIONS[cat]?.label || cat}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Description (optional)</Label>
                  <Input
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Brief description..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  accept="*/*"
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Choose File & Upload"}
                </Button>
              </div>
            </div>
          )}

          {/* Document List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-200 border-t-sky-600" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents yet</p>
              <p className="text-xs mt-1">Click Upload to add contracts, quotes, designs, and more</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors group"
                >
                  {getFileIcon(doc.content_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {doc.original_filename}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`text-xs ${CATEGORY_OPTIONS[doc.category]?.color || "bg-zinc-100 text-zinc-700"}`}>
                        {CATEGORY_OPTIONS[doc.category]?.label || doc.category}
                      </Badge>
                      <span className="text-xs text-slate-400">{formatFileSize(doc.file_size)}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(doc.content_type.startsWith("image/") || doc.content_type === "application/pdf") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(doc)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc.document_id)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(doc.document_id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-medium text-slate-700">{previewDoc.original_filename}</h3>
              <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[80vh]">
              {previewDoc.content_type.startsWith("image/") ? (
                <img src={getDocumentDownloadUrl(previewDoc.document_id)} alt={previewDoc.original_filename} className="max-w-full mx-auto rounded-lg" />
              ) : (
                <iframe src={getDocumentDownloadUrl(previewDoc.document_id)} className="w-full h-[70vh] rounded-lg border" title="Document Preview" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
