import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Info, Layers, Palette, ScanText, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Tooltip } from './Tooltip';
import type { ImageFile } from '../types';

interface ImageUploadNodesProps {
  controlNetImg: ImageFile | null;
  setControlNetImg: (img: ImageFile | null) => void;
  ipAdapterImg: ImageFile | null;
  setIpAdapterImg: (img: ImageFile | null) => void;
  florenceImg: ImageFile | null;
  setFlorenceImg: (img: ImageFile | null) => void;
  ipAdapterStrength?: number;
  setIpAdapterStrength?: (val: number) => void;
  florenceStrength?: number;
  setFlorenceStrength?: (val: number) => void;
}

const ImageUploadNodes: React.FC<ImageUploadNodesProps> = ({
  controlNetImg,
  setControlNetImg,
  ipAdapterImg,
  setIpAdapterImg,
  florenceImg,
  setFlorenceImg,
  ipAdapterStrength = 0.8,
  setIpAdapterStrength,
  florenceStrength = 0.8,
  setFlorenceStrength,
}) => {
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.src = URL.createObjectURL(file);
    });

  const createDropHandler = (setter: (img: ImageFile | null) => void) =>
    useCallback(
      async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
          const base64 = await fileToBase64(file);
          const dimensions = await getImageDimensions(file);
          setter({ file, preview: URL.createObjectURL(file), base64, ...dimensions });
        }
      },
      [setter],
    );

  const { getRootProps: getRootCN, getInputProps: getInputCN, isDragActive: isDragCN } = useDropzone({ onDrop: createDropHandler(setControlNetImg), accept: { 'image/*': [] }, multiple: false } as Parameters<typeof useDropzone>[0]);
  const { getRootProps: getRootIP, getInputProps: getInputIP, isDragActive: isDragIP } = useDropzone({ onDrop: createDropHandler(setIpAdapterImg), accept: { 'image/*': [] }, multiple: false } as Parameters<typeof useDropzone>[0]);
  const { getRootProps: getRootFL, getInputProps: getInputFL, isDragActive: isDragFL } = useDropzone({ onDrop: createDropHandler(setFlorenceImg), accept: { 'image/*': [] }, multiple: false } as Parameters<typeof useDropzone>[0]);

  const UploadZone = ({
    getRootProps,
    getInputProps,
    isDragActive,
    img,
    onClear,
    alt,
    label,
    accentClass,
  }: {
    getRootProps: () => React.HTMLAttributes<HTMLDivElement>;
    getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
    isDragActive: boolean;
    img: ImageFile | null;
    onClear: () => void;
    alt: string;
    label: string;
    accentClass: string;
  }) => (
    <div
      {...getRootProps()}
      className={`relative flex-1 aspect-square rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
        isDragActive
          ? `${accentClass} bg-opacity-10`
          : 'border-[var(--color-border)] hover:[border-color:var(--color-border-strong)] bg-[var(--color-bg-surface-alt)]'
      }`}
    >
      <input {...getInputProps()} />
      {img ? (
        <>
          <img src={img.preview} alt={alt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <AnimatePresence>
            <motion.button
              key="clear"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors z-10 hover:[background:var(--color-accent)]"
              style={{ background: 'var(--color-overlay, rgba(0,0,0,0.5))' }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </AnimatePresence>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-2 p-4 text-center">
          <Upload className="w-6 h-6" />
          <p className="text-xs">{label}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* ControlNet Node */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-[var(--color-text-primary)]">
          <Layers className="w-4 h-4 text-[var(--color-info)]" />
          <h3 className="text-sm font-medium">원본 이미지</h3>
          <Tooltip text="건물의 뼈대를 결정합니다. 화이트 모델, 스케치, 혹은 도면 이미지를 넣어주세요. 구조는 그대로 유지됩니다.">
            <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] cursor-help" />
          </Tooltip>
        </div>
        <UploadZone
          getRootProps={getRootCN}
          getInputProps={getInputCN}
          isDragActive={isDragCN}
          img={controlNetImg}
          onClear={() => setControlNetImg(null)}
          alt="ControlNet"
          label="Clay Model / Base"
          accentClass="border-[var(--color-info)]"
        />
      </div>

      {/* IPAdapter Node */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-[var(--color-text-primary)]">
          <Palette className="w-4 h-4 text-[var(--color-purple)]" />
          <h3 className="text-sm font-medium">IPAdapter (Style)</h3>
          <Tooltip text="원하는 색감이나 재질이 담긴 이미지를 넣으세요. 건물에 그 느낌(재질, 빛)만 입혀줍니다.">
            <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] cursor-help" />
          </Tooltip>
        </div>
        <UploadZone
          getRootProps={getRootIP}
          getInputProps={getInputIP}
          isDragActive={isDragIP}
          img={ipAdapterImg}
          onClear={() => setIpAdapterImg(null)}
          alt="IPAdapter"
          label="Style Reference"
          accentClass="border-[var(--color-purple)]"
        />
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${ipAdapterImg ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-subtle)]'}`}>
              Style Strength
              <Tooltip text="레퍼런스 이미지의 영향력을 조절합니다. 0에 가까우면 무시하고, 1에 가까우면 사진을 그대로 따릅니다.">
                <Info className="w-3 h-3 cursor-help" />
              </Tooltip>
            </label>
            <span className={`text-[10px] font-mono font-bold ${ipAdapterImg ? 'text-[var(--color-purple)]' : 'text-[var(--color-text-subtle)]'}`}>{ipAdapterStrength.toFixed(1)}</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.1"
            value={ipAdapterStrength}
            onChange={(e) => setIpAdapterStrength?.(parseFloat(e.target.value))}
            disabled={!ipAdapterImg}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-brand ${ipAdapterImg ? 'bg-[var(--color-border)]' : 'bg-[var(--color-bg-surface-alt)]'}`}
          />
        </div>
      </div>

      {/* Florence Node */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3 text-[var(--color-text-primary)]">
          <ScanText className="w-4 h-4 text-[var(--color-warning)]" />
          <h3 className="text-sm font-medium">Florence (Context)</h3>
          <Tooltip text="주변 배경이나 분위기를 결정합니다. 숲, 도시, 하늘 등 환경 정보가 담긴 이미지를 활용하세요.">
            <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] cursor-help" />
          </Tooltip>
        </div>
        <UploadZone
          getRootProps={getRootFL}
          getInputProps={getInputFL}
          isDragActive={isDragFL}
          img={florenceImg}
          onClear={() => setFlorenceImg(null)}
          alt="Florence"
          label="Context Image"
          accentClass="border-[var(--color-warning)]"
        />
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${florenceImg ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-subtle)]'}`}>
              Context Strength
              <Tooltip text="레퍼런스 이미지의 영향력을 조절합니다. 0에 가까우면 무시하고, 1에 가까우면 사진을 그대로 따릅니다.">
                <Info className="w-3 h-3 cursor-help" />
              </Tooltip>
            </label>
            <span className={`text-[10px] font-mono font-bold ${florenceImg ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-subtle)]'}`}>{florenceStrength.toFixed(1)}</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.1"
            value={florenceStrength}
            onChange={(e) => setFlorenceStrength?.(parseFloat(e.target.value))}
            disabled={!florenceImg}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-brand ${florenceImg ? 'bg-[var(--color-border)]' : 'bg-[var(--color-bg-surface-alt)]'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageUploadNodes;
