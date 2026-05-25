import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import ImageUploadNodes from './components/ImageUploadNodes';
import SettingsPanel from './components/SettingsPanel';
import PromptPanel from './components/PromptPanel';
import PreviewCanvas from './components/PreviewCanvas';
import { generateRendering } from './api/render';
import type { ImageFile } from './types';

export default function App() {
  const [controlNetImg, setControlNetImg] = useState<ImageFile | null>(null);
  const [ipAdapterImg, setIpAdapterImg] = useState<ImageFile | null>(null);
  const [florenceImg, setFlorenceImg] = useState<ImageFile | null>(null);

  const [positivePrompt, setPositivePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');

  const [seedMode, setSeedMode] = useState<'random' | 'fixed'>('random');
  const [seedValue, setSeedValue] = useState(42);
  const [temperature, setTemperature] = useState(0.7);

  const [ipAdapterStrength, setIpAdapterStrength] = useState(0.8);
  const [florenceStrength, setFlorenceStrength] = useState(0.8);

  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateRendering = async () => {
    if (!controlNetImg) return setError('Please upload the Structure image.');

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateRendering({
        control_net_base64: controlNetImg.base64,
        control_net_mime: controlNetImg.file.type || 'image/jpeg',
        control_net_width: controlNetImg.width ?? 1,
        control_net_height: controlNetImg.height ?? 1,
        ip_adapter_base64: ipAdapterImg?.base64,
        ip_adapter_mime: ipAdapterImg?.file.type,
        florence_base64: florenceImg?.base64,
        florence_mime: florenceImg?.file.type,
        positive_prompt: positivePrompt,
        negative_prompt: negativePrompt,
        seed_mode: seedMode,
        seed_value: seedValue,
        temperature,
      });
      setResultImage(`data:${result.mime_type};base64,${result.image_base64}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[var(--color-bg-page)]">
      <header className="shrink-0 flex items-baseline gap-4 px-6 py-3 border-b border-[var(--color-border)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Sketch 2 Render</h1>
        <div className="flex items-baseline gap-2">
          <span className="text-base text-[var(--color-text-muted)] font-medium">for Exterior</span>
          <span className="text-[10px] text-[var(--color-text-faint)] font-medium uppercase tracking-wider">
            © 2026. Junghyun Kim. All rights reserved.
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — uploads + generate */}
        <div className="w-72 shrink-0 flex flex-col gap-3 p-4 border-r border-[var(--color-border)] overflow-y-auto">
          <ImageUploadNodes
            controlNetImg={controlNetImg} setControlNetImg={setControlNetImg}
            ipAdapterImg={ipAdapterImg} setIpAdapterImg={setIpAdapterImg}
            florenceImg={florenceImg} setFlorenceImg={setFlorenceImg}
            ipAdapterStrength={ipAdapterStrength} setIpAdapterStrength={setIpAdapterStrength}
            florenceStrength={florenceStrength} setFlorenceStrength={setFlorenceStrength}
          />
          <button
            onClick={handleGenerateRendering}
            disabled={!controlNetImg || isGenerating}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-wide text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md hover:[background:var(--color-accent-hover)]"
            style={{ background: 'var(--color-accent)' }}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 처리 중...</>
            ) : (
              '렌더링 시작'
            )}
          </button>
          {error && (
            <p className="text-[var(--color-danger)] p-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-xl text-xs">{error}</p>
          )}
        </div>

        {/* Middle Panel — settings + prompts */}
        <div className="w-[400px] shrink-0 flex flex-col gap-3 p-4 border-r border-[var(--color-border)] overflow-y-auto">
          <SettingsPanel
            temperature={temperature} setTemperature={setTemperature}
            seedMode={seedMode} setSeedMode={setSeedMode}
            seedValue={seedValue} setSeedValue={setSeedValue}
          />
          <PromptPanel
            positivePrompt={positivePrompt} setPositivePrompt={setPositivePrompt}
            negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
          />
        </div>

        {/* Right Panel — preview canvas */}
        <div className="flex-1 overflow-hidden p-4">
          <PreviewCanvas
            resultImage={resultImage} setResultImage={setResultImage}
            controlNetImg={controlNetImg}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}
