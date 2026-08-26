"use client";
import { useState, useRef } from "react";
import { Upload, Eye, Download, FileText, Loader2, CheckCircle2, AlertCircle, FileImage, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

interface AadharUploadProps {
  type: "labour" | "supervisor";
  id: string;
  currentUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export function AadharUpload({ type, id, currentUrl, onUploadSuccess }: AadharUploadProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"select" | "pdf" | "photo">("select");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);

  const pdfRef = useRef<HTMLInputElement>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setUploadMode("select");
    setFrontImage(null);
    setBackImage(null);
    setError(null);
    setSuccess(false);
  };

  const mergeImages = async (frontFile: File, backFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img1 = new Image();
      const img2 = new Image();
      const url1 = URL.createObjectURL(frontFile);
      const url2 = URL.createObjectURL(backFile);

      img1.onload = () => {
        img2.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Failed to get canvas context"));
          
          // Target width to ensure readability while heavily compressing
          const targetWidth = 1000;
          
          const scale1 = targetWidth / img1.width;
          const h1 = img1.height * scale1;
          
          const scale2 = targetWidth / img2.width;
          const h2 = img2.height * scale2;

          canvas.width = targetWidth;
          const padding = 20;
          canvas.height = h1 + padding + h2;

          // White background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.drawImage(img1, 0, 0, targetWidth, h1);
          ctx.drawImage(img2, 0, h1 + padding, targetWidth, h2);

          // Compress to JPEG with 0.6 quality (should easily be < 200kb)
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Failed to compress image"));
            resolve(new File([blob], `merged-aadhar-${Date.now()}.jpg`, { type: "image/jpeg" }));
          }, "image/jpeg", 0.6);
        };
        img2.onerror = () => reject(new Error("Failed to load back image"));
        img2.src = url2;
      };
      img1.onerror = () => reject(new Error("Failed to load front image"));
      img1.src = url1;
    });
  };

  async function handleDirectPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await performUpload(file);
  }

  async function handleMergedPhotoUpload() {
    if (!frontImage || !backImage) {
      setError("Please select both front and back photos.");
      return;
    }
    setUploading(true);
    try {
      const mergedFile = await mergeImages(frontImage, backImage);
      await performUpload(mergedFile);
    } catch (err: any) {
      setError(err.message || "Failed to process images.");
      setUploading(false);
    }
  }

  async function performUpload(file: File) {
    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      form.append("id", id);

      const res = await fetch("/api/upload-aadhar", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed. Please try again.");
      } else {
        setUrl(data.url);
        if (onUploadSuccess) onUploadSuccess(data.url);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setTimeout(() => setIsOpen(false), 1000); // Close modal on success
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shrink-0">
          <FileText className="h-3.5 w-3.5 text-violet-600" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Aadhar Card Document
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) resetState();
        }}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 text-xs font-semibold w-full sm:w-auto ${url ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white border-0'}`}
            >
              <Upload className="h-3.5 w-3.5" />
              {url ? "Replace Aadhar" : "Upload Aadhar"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] z-[110]">
            <DialogHeader>
              <DialogTitle>Upload Aadhar Card</DialogTitle>
              <DialogDescription>
                Select the format of your document. Photos will be heavily compressed to save space.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg mb-4">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  Uploaded successfully!
                </div>
              )}

              {uploadMode === "select" && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUploadMode("pdf")}
                    className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <FileIcon className="h-6 w-6 text-slate-500 group-hover:text-blue-600" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-blue-700">PDF Document</span>
                    <span className="text-[10px] text-slate-500 text-center">Single file containing both sides</span>
                  </button>

                  <button
                    onClick={() => setUploadMode("photo")}
                    className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <FileImage className="h-6 w-6 text-slate-500 group-hover:text-emerald-600" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-700">Photos (JPG/PNG)</span>
                    <span className="text-[10px] text-slate-500 text-center">Separate front & back images</span>
                  </button>
                </div>
              )}

              {uploadMode === "pdf" && (
                <div className="space-y-4">
                  <div className="flex justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <input
                      ref={pdfRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleDirectPdfUpload}
                    />
                    <Button 
                      onClick={() => pdfRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploading ? "Uploading PDF..." : "Select & Upload PDF"}
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setUploadMode("select")} disabled={uploading}>
                    Back
                  </Button>
                </div>
              )}

              {uploadMode === "photo" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Front Photo */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 text-center">FRONT SIDE</label>
                      <input
                        ref={frontRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => setFrontImage(e.target.files?.[0] || null)}
                      />
                      <button 
                        onClick={() => frontRef.current?.click()}
                        className={`h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${frontImage ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 hover:border-slate-400 text-slate-500'}`}
                      >
                        {frontImage ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 mb-1" />
                            Selected
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 mb-1" />
                            Select Front
                          </>
                        )}
                      </button>
                    </div>

                    {/* Back Photo */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-600 text-center">BACK SIDE</label>
                      <input
                        ref={backRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => setBackImage(e.target.files?.[0] || null)}
                      />
                      <button 
                        onClick={() => backRef.current?.click()}
                        className={`h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${backImage ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 hover:border-slate-400 text-slate-500'}`}
                      >
                        {backImage ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 mb-1" />
                            Selected
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 mb-1" />
                            Select Back
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700" 
                      disabled={!frontImage || !backImage || uploading}
                      onClick={handleMergedPhotoUpload}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      {uploading ? "Merging & Uploading..." : "Merge & Upload Photos"}
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setUploadMode("select")} disabled={uploading}>
                    Back
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* View button */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50 dark:hover:bg-blue-900/30 transition-colors select-none"
          >
            <Eye className="h-3.5 w-3.5" />
            View Document
          </a>
        )}

        {/* Download button */}
        {url && (
          <a
            href={url}
            download={`aadhar-${type}-${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50 dark:hover:bg-emerald-900/30 transition-colors select-none"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        )}
      </div>

      {!url && (
        <p className="text-xs text-slate-400 dark:text-slate-500">No document uploaded yet. Click Upload to select format.</p>
      )}
    </div>
  );
}
