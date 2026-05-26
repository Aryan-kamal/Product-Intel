import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileVideo, FileSpreadsheet, Loader2, CheckCircle2, Sparkles, ArrowRight, X } from 'lucide-react';
import api from '../lib/api';

export default function UploadPage() {
  const [mode, setMode] = useState<'video' | 'csv'>('video');
  const [file, setFile] = useState<File | null>(null);
  const [enhanceTitle, setEnhanceTitle] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append(mode === 'video' ? 'video' : 'csv', file);
      formData.append('enhanceTitle', String(enhanceTitle));

      const endpoint = mode === 'video' ? '/upload-video' : '/upload-products-csv';
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/jobs`);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Upload Product Data</h1>
        <p className="text-gray-500 text-sm">Upload a product video or CSV file to extract and analyze product information.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => { setMode('video'); setFile(null); }}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-4 text-sm font-medium transition-all ${
              mode === 'video'
                ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            <FileVideo className="w-5 h-5" />
            Product Video
          </button>
          <button
            onClick={() => { setMode('csv'); setFile(null); }}
            className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-4 text-sm font-medium transition-all ${
              mode === 'csv'
                ? 'text-indigo-400 bg-indigo-500/5 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            Product CSV
          </button>
        </div>

        <div className="p-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-indigo-500/50 bg-indigo-500/5 scale-[1.01]'
                : file
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/[0.08] hover:border-indigo-500/30 hover:bg-white/[0.02]'
            }`}
          >
            {file ? (
              <div className="animate-fade-in">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-gray-200">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {mode === 'video' ? <FileVideo className="w-7 h-7 text-gray-500" /> : <FileSpreadsheet className="w-7 h-7 text-gray-500" />}
                </div>
                <p className="text-sm font-medium text-gray-400">
                  Drop your {mode === 'video' ? 'video' : 'CSV'} here, or <span className="text-indigo-400">browse</span>
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {mode === 'video' ? 'Supports MP4, WebM, MOV up to 50MB' : 'CSV file up to 5MB'}
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept={mode === 'video' ? 'video/*' : '.csv'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="mt-5 p-4 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 rounded-xl border border-violet-500/10">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">Enhance product titles</p>
                  <p className="text-xs text-gray-500">Auto-generate optimized titles using product attributes</p>
                </div>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${enhanceTitle ? 'bg-indigo-600' : 'bg-white/[0.08]'}`}
                onClick={() => setEnhanceTitle(!enhanceTitle)}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enhanceTitle ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
          >
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <>Upload & Process <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>

      {mode === 'csv' && (
        <div className="mt-6 card p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Expected CSV Format</h3>
          <div className="overflow-x-auto">
            <code className="text-[11px] text-gray-500 block whitespace-nowrap">
              sku_id, product_title, description, brand, category, price, mrp, image_url, product_url, availability, color, size, material
            </code>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            See <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-gray-400">sample-data/products.csv</code> for an example file.
          </p>
        </div>
      )}
    </div>
  );
}
