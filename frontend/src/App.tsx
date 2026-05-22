import React, { useState } from 'react';
import { Loader2, Shield } from 'lucide-react';
import ImageUploadNodes from './components/ImageUploadNodes';
import SettingsPanel from './components/SettingsPanel';
import PromptPanel from './components/PromptPanel';
import PreviewCanvas from './components/PreviewCanvas';
import { generateRendering } from './api/render';
import type { ImageFile } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('site_auth') === 'true',
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '0908') {
      setIsAuthenticated(true);
      sessionStorage.setItem('site_auth', 'true');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
      setPasswordInput('');
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans text-white">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <Shield className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sketch 2 Render</h1>
          <p className="text-zinc-400 text-sm mb-6">Enter password to access ArchViz Engine</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 mb-4 text-center focus:outline-none focus:border-indigo-500 tracking-widest"
            />
            {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold transition-all">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans pb-20">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8 flex items-baseline gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-white">Sketch 2 Render</h1>
          <div className="flex items-baseline gap-2">
            <span className="text-lg text-zinc-500 font-medium">for Exterior</span>
            <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
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
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold uppercase tracking-wide text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Executing Pipeline...</>
              ) : (
                'Queue Prompt'
              )}
            </button>
            {error && (
              <p className="text-red-400 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-sm">{error}</p>
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
