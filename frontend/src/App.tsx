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
    <div className="min-h-screen bg-[var(--color-bg-page)] pb-20">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8 flex items-baseline gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">Sketch 2 Render</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-lg text-[var(--color-text-muted)] font-medium">for Exterior</span>
            <span className="text-[10px] text-[var(--color-text-faint)] font-medium uppercase tracking-wider">
              © 2026. Junghyun Kim. All rights reserved.
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <ImageUploadNodes
              controlNetImg={controlNetImg} setControlNetImg={setControlNetImg}
              ipAdapterImg={ipAdapterImg} setIpAdapterImg={setIpAdapterImg}
              florenceImg={florenceImg} setFlorenceImg={setFlorenceImg}
              ipAdapterStrength={ipAdapterStrength} setIpAdapterStrength={setIpAdapterStrength}
              florenceStrength={florenceStrength} setFlorenceStrength={setFlorenceStrength}
            />
            <SettingsPanel
              temperature={temperature} setTemperature={setTemperature}
              seedMode={seedMode} setSeedMode={setSeedMode}
              seedValue={seedValue} setSeedValue={setSeedValue}
            />
            <PromptPanel
              positivePrompt={positivePrompt} setPositivePrompt={setPositivePrompt}
              negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
            />
            <button
              onClick={handleGenerateRendering}
              disabled={!controlNetImg || isGenerating}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-wide text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md hover:[background:var(--color-accent-hover)]"
              style={{ background: 'var(--color-accent)' }}
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Executing Pipeline...</>
              ) : (
                'Queue Prompt'
              )}
            </button>
            {error && (
              <p className="text-[var(--color-danger)] p-4 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-xl text-sm">{error}</p>
            )}
          </div>
          <div className="lg:col-span-5 relative">
            <PreviewCanvas
              resultImage={resultImage} setResultImage={setResultImage}
              controlNetImg={controlNetImg}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
