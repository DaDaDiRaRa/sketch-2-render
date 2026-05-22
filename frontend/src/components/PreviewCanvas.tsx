import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  Pencil,
  Undo2,
  Download,
  Eraser,
  Check,
  Loader2,
  Maximize2,
  Info,
} from 'lucide-react';
import type { ImageFile } from '../types';
import { applyInpaintingApi } from '../api/inpaint';
import { upscaleImageApi } from '../api/upscale';

interface PreviewCanvasProps {
  resultImage: string | null;
  setResultImage?: (val: string | null) => void;
  isEditing?: boolean;
  setIsEditing?: (val: boolean) => void;
  setShowComparison?: (val: boolean) => void;
  history?: string[];
  handleUndo?: () => void;
  handleDownload?: () => void;
  editPrompt?: string;
  setEditPrompt?: (val: string) => void;
  editPromptRef?: React.RefObject<HTMLTextAreaElement>;
  brushSize?: number;
  setBrushSize?: (val: number) => void;
  brushColor?: string;
  setBrushColor?: (val: string) => void;
  clearMask?: () => void;
  applyInpainting?: () => Promise<void>;
  isApplyingEdit?: boolean;
  handleUpscale?: (target: string) => Promise<void>;
  isUpscaling?: boolean;
  upscaleTarget?: string | null;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  canvasSize?: { width: number; height: number };
  startDrawing?: (e: React.MouseEvent | React.TouchEvent) => void;
  draw?: (e: React.MouseEvent | React.TouchEvent) => void;
  stopDrawing?: () => void;
  controlNetImg?: ImageFile | null;
  comparisonValue?: number;
  setComparisonValue?: (val: number) => void;
  isGenerating?: boolean;
}

const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  resultImage,
  setResultImage,
  isEditing: propsIsEditing,
  setIsEditing: propsSetIsEditing,
  setShowComparison: propsSetShowComparison,
  history: propsHistory,
  handleUndo: propsHandleUndo,
  handleDownload: propsHandleDownload,
  editPrompt: propsEditPrompt,
  setEditPrompt: propsSetEditPrompt,
  editPromptRef: propsEditPromptRef,
  brushSize: propsBrushSize,
  setBrushSize: propsSetBrushSize,
  brushColor: propsBrushColor,
  setBrushColor: propsSetBrushColor,
  clearMask: propsClearMask,
  applyInpainting: propsApplyInpainting,
  isApplyingEdit: propsIsApplyingEdit,
  handleUpscale: propsHandleUpscale,
  isUpscaling: propsIsUpscaling,
  upscaleTarget: propsUpscaleTarget,
  canvasRef: propsCanvasRef,
  canvasSize: propsCanvasSize,
  startDrawing: propsStartDrawing,
  draw: propsDraw,
  stopDrawing: propsStopDrawing,
  controlNetImg,
  comparisonValue: propsComparisonValue,
  setComparisonValue: propsSetComparisonValue,
  isGenerating = false,
}) => {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [internalHistory, setInternalHistory] = useState<string[]>([]);
  const [internalEditPrompt, setInternalEditPrompt] = useState('');
  const [internalBrushSize, setInternalBrushSize] = useState(30);
  const [internalBrushColor, setInternalBrushColor] = useState('rgba(57, 255, 20, 0.8)');
  const [internalIsApplyingEdit, setInternalIsApplyingEdit] = useState(false);
  const [internalIsUpscaling, setInternalIsUpscaling] = useState(false);
  const [internalUpscaleTarget, setInternalUpscaleTarget] = useState<string | null>(null);
  const [internalComparisonValue, setInternalComparisonValue] = useState(50);
  const [internalCanvasSize, setInternalCanvasSize] = useState({ width: 1024, height: 1024 });
  const [isDrawing, setIsDrawing] = useState(false);

  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const internalEditPromptRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = propsIsEditing !== undefined ? propsIsEditing : internalIsEditing;
  const setIsEditing = propsSetIsEditing ?? setInternalIsEditing;
  const [, setInternalShowComparison] = useState(false);
  const setShowComparison = propsSetShowComparison ?? setInternalShowComparison;
  const history = propsHistory !== undefined ? propsHistory : internalHistory;
  const setHistory = setInternalHistory;
  const editPrompt = propsEditPrompt !== undefined ? propsEditPrompt : internalEditPrompt;
  const setEditPrompt = propsSetEditPrompt ?? setInternalEditPrompt;
  const editPromptRef = propsEditPromptRef ?? internalEditPromptRef;
  const brushSize = propsBrushSize !== undefined ? propsBrushSize : internalBrushSize;
  const setBrushSize = propsSetBrushSize ?? setInternalBrushSize;
  const brushColor = propsBrushColor !== undefined ? propsBrushColor : internalBrushColor;
  const setBrushColor = propsSetBrushColor ?? setInternalBrushColor;
  const isApplyingEdit = propsIsApplyingEdit !== undefined ? propsIsApplyingEdit : internalIsApplyingEdit;
  const isUpscaling = propsIsUpscaling !== undefined ? propsIsUpscaling : internalIsUpscaling;
  const upscaleTarget = propsUpscaleTarget !== undefined ? propsUpscaleTarget : internalUpscaleTarget;
  const canvasRef = propsCanvasRef ?? internalCanvasRef;
  const canvasSize = propsCanvasSize !== undefined ? propsCanvasSize : internalCanvasSize;
  const comparisonValue = propsComparisonValue !== undefined ? propsComparisonValue : internalComparisonValue;
  const setComparisonValue = propsSetComparisonValue ?? setInternalComparisonValue;

  useEffect(() => {
    if (controlNetImg?.width && controlNetImg?.height) {
      const ratio = controlNetImg.width / controlNetImg.height;
      setInternalCanvasSize({ width: 1024, height: 1024 / ratio });
    }
  }, [controlNetImg]);

  const handleUndo = () => {
    if (propsHandleUndo) return propsHandleUndo();
    if (history.length === 0 || !setResultImage) return;
    const newHistory = [...history];
    const previousImage = newHistory.pop();
    if (previousImage) {
      setResultImage(previousImage);
      setHistory(newHistory);
    }
  };

  const handleDownload = () => {
    if (propsHandleDownload) return propsHandleDownload();
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'architectural-rendering.png';
    link.click();
  };

  const clearMask = () => {
    if (propsClearMask) return propsClearMask();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (propsStartDrawing) return propsStartDrawing(e);
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (propsStopDrawing) return propsStopDrawing();
    setIsDrawing(false);
    canvasRef.current?.getContext('2d')?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (propsDraw) return propsDraw(e);
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // --- Backend API calls (no Gemini SDK on frontend) ---

  const applyInpainting = async () => {
    if (propsApplyInpainting) return propsApplyInpainting();
    if (!resultImage || !canvasRef.current || !setResultImage) return;

    setInternalIsApplyingEdit(true);
    try {
      const maskBase64 = canvasRef.current.toDataURL('image/png').split(',')[1];
      const imageBase64 = resultImage.split(',')[1];
      const result = await applyInpaintingApi(imageBase64, maskBase64, editPrompt);
      setHistory((prev) => [...prev, resultImage]);
      setResultImage(`data:${result.mime_type};base64,${result.image_base64}`);
      setIsEditing(false);
      clearMask();
    } catch (err) {
      console.error('Inpainting error:', err);
    } finally {
      setInternalIsApplyingEdit(false);
    }
  };

  const handleUpscale = async (resolution: string) => {
    if (propsHandleUpscale) return propsHandleUpscale(resolution);
    if (!resultImage || internalIsUpscaling || !setResultImage) return;

    setInternalIsUpscaling(true);
    setInternalUpscaleTarget(resolution);
    try {
      const imageBase64 = resultImage.split(',')[1];
      const result = await upscaleImageApi(imageBase64, resolution);
      setHistory((prev) => [...prev, resultImage]);
      setResultImage(`data:${result.mime_type};base64,${result.image_base64}`);
    } catch (err) {
      console.error('Upscale error:', err);
    } finally {
      setInternalIsUpscaling(false);
      setInternalUpscaleTarget(null);
    }
  };

  return (
    <div className="lg:col-span-5 relative">
      <div className="sticky top-24">
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-medium text-[var(--color-text-primary)] font-mono uppercase tracking-wider">Preview Image Node</h2>
            </div>
            <div className="flex items-center gap-2">
              {resultImage && (
                <>
                  <button
                    onClick={() => { setIsEditing(true); setShowComparison(false); }}
                    className="p-1.5 rounded-md transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase border bg-[var(--color-bg-surface-alt)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:[color:var(--color-text-primary)] hover:[border-color:var(--color-border-strong)]"
                  >
                    <Pencil className="w-3 h-3" />
                    Enter Focus Edit
                  </button>
                  {history.length > 0 && (
                    <button
                      onClick={handleUndo}
                      className="p-1.5 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] rounded-md transition-colors text-[var(--color-text-muted)] hover:[color:var(--color-text-primary)] hover:[border-color:var(--color-border-strong)] flex items-center gap-1.5 text-[10px] font-bold uppercase"
                    >
                      <Undo2 className="w-3 h-3" />
                      Undo
                    </button>
                  )}
                  <button onClick={handleDownload} className="p-1.5 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] rounded-md transition-colors text-[var(--color-text-muted)] hover:[color:var(--color-text-primary)] hover:[border-color:var(--color-border-strong)]">
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {resultImage && (
            <div className="mb-4 p-3 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Maximize2 className="w-3 h-3 text-[var(--color-text-muted)]" />
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Professional Upscale</span>
              </div>
              <div className="flex gap-2">
                {['1K', '2K', '4K'].map((res) => (
                  <button
                    key={res}
                    onClick={() => handleUpscale(res)}
                    disabled={isUpscaling}
                    className="flex-1 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:[border-color:var(--color-accent)] hover:[background:var(--color-accent-soft)] text-[var(--color-text-muted)] hover:[color:var(--color-accent)] rounded-md text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="flex-1 rounded-lg overflow-hidden flex items-center justify-center relative"
            style={{ background: 'var(--brand-black)', border: '1px solid var(--color-border)' }}
          >
            <AnimatePresence mode="wait">
              {isUpscaling && (
                <motion.div key="upscale-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                >
                  <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
                  <p className="text-xs font-bold text-[var(--color-text-on-accent)] uppercase tracking-widest animate-pulse">Enhancing to {upscaleTarget}...</p>
                </motion.div>
              )}
              {resultImage ? (
                <motion.div key="result-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative w-full h-full overflow-hidden cursor-ew-resize flex items-center justify-center"
                >
                  <div className="relative w-full h-full">
                    <img src={controlNetImg?.preview} alt="Before" className="absolute inset-0 w-full h-full object-contain opacity-50 grayscale" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - comparisonValue}% 0 0)` }}>
                      <img src={resultImage} alt="After" className="absolute inset-0 w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10" style={{ left: `${comparisonValue}%` }}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-zinc-900">
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-3 bg-zinc-400 rounded-full" />
                          <div className="w-0.5 h-3 bg-zinc-400 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 pointer-events-none z-30">Structure</div>
                  <div
                    className="absolute bottom-4 right-4 px-2 py-1 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none z-30"
                    style={{ background: 'rgba(230,0,18,0.5)', border: '1px solid rgba(230,0,18,0.3)' }}
                  >Render</div>
                  <input
                    type="range" min="0" max="100"
                    value={comparisonValue}
                    onChange={(e) => setComparisonValue(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
                  />
                </motion.div>
              ) : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-[var(--color-text-subtle)] p-8 text-center"
                >
                  <div
                    className="w-12 h-12 rounded flex items-center justify-center mb-4"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-mono text-[var(--color-text-subtle)]">Waiting for KSampler output...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isGenerating && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
                <div className="text-center font-mono">
                  <p className="text-sm text-[var(--color-text-on-accent)]">Processing Nodes...</p>
                  <p className="text-xs text-zinc-500 mt-1">Applying ControlNet & IPAdapter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Focus Edit Overlay */}
      <AnimatePresence>
        {isEditing && resultImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col p-6 items-center overflow-hidden"
            style={{ background: 'var(--brand-black)' }}
          >
            <div className="w-full max-w-[1600px] flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-accent-soft)] rounded-lg">
                  <Pencil className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text-on-accent)] tracking-tight">Focus Edit Mode</h2>
                  <p className="text-xs text-[var(--color-text-subtle)] font-medium tracking-wide font-mono uppercase">Inpainting & Masking Engine</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={clearMask} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
                  <Eraser className="w-4 h-4" />
                  Clear Mask
                </button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
                  Cancel
                </button>
                <button onClick={applyInpainting} disabled={isApplyingEdit}
                  className="flex items-center gap-2 px-6 py-2 bg-[var(--color-accent)] hover:[background:var(--color-accent-hover)] disabled:opacity-50 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg"
                >
                  {isApplyingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Generate Edit
                </button>
              </div>
            </div>

            <div className="w-full max-w-[1600px] flex-1 flex gap-8 min-h-0">
              <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative flex items-center justify-center p-8">
                <div
                  className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden border border-white/5"
                  style={{
                    aspectRatio: controlNetImg ? `${controlNetImg.width} / ${controlNetImg.height}` : 'auto',
                    width: controlNetImg ? (controlNetImg.width! > controlNetImg.height! ? '100%' : 'auto') : 'auto',
                    height: controlNetImg ? (controlNetImg.height! >= controlNetImg.width! ? '100%' : 'auto') : 'auto',
                  }}
                >
                  <img src={resultImage} alt="To Edit" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    width={canvasSize.width} height={canvasSize.height}
                    className="absolute inset-0 w-full h-full object-contain cursor-crosshair touch-none"
                  />
                </div>
              </div>

              <div className="w-80 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-[var(--color-text-subtle)] uppercase tracking-[0.2em] mb-3 block">Instruction</label>
                    <textarea
                      ref={editPromptRef}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="e.g. 'Add a wooden balcony here', 'Change to a glass facade'..."
                      className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-all resize-none leading-relaxed"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-[var(--color-text-subtle)] uppercase tracking-[0.2em]">Brush Size</label>
                      <span className="text-[10px] font-mono text-[var(--color-accent)] font-bold">{brushSize}px</span>
                    </div>
                    <input type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--color-text-subtle)] uppercase tracking-[0.2em] block">Brush Color</label>
                    <div className="flex gap-2.5">
                      {[
                        { color: 'rgba(57, 255, 20, 0.8)', label: 'Green' },
                        { color: 'rgba(255, 20, 147, 0.8)', label: 'Pink' },
                        { color: 'rgba(0, 255, 255, 0.8)', label: 'Cyan' },
                      ].map((c) => (
                        <button key={c.color} onClick={() => setBrushColor(c.color)}
                          className={`w-8 h-8 rounded-full border-4 transition-all ${brushColor === c.color ? 'border-white scale-110 shadow-lg shadow-white/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: c.color.replace('0.8', '1') }}
                        />
                      ))}
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-xl"
                    style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent-border)' }}
                  >
                    <div className="flex items-start gap-2 text-[10px] text-[var(--color-text-muted)] font-medium leading-relaxed">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-accent)]" />
                      Tip: 마스크 영역은 수정될 곳이며, 브러시 색상은 작업 편의를 위한 시각적 요소입니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-6 text-[10px] font-mono font-bold text-[var(--color-text-subtle)] uppercase tracking-widest">
              <span>Ready for Processing</span>
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <span>Hardware Acceleration Enabled</span>
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <span>Gemini 2.0 Advanced Arch-Inpainter</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreviewCanvas;
