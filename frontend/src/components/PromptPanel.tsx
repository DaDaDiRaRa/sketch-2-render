import React, { useState } from 'react';
import { Palette, Info, Sparkles, Loader2, Shield } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { improvePositivePrompt, improveNegativePrompt } from '../api/prompt';

interface StylePreset {
  id: string;
  name: string;
  icon: string;
  positive: string;
  negative: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'sunny',
    name: 'Sunny Day',
    icon: '☀️',
    positive: '(Masterpiece:1.3), (photorealistic:1.4), best quality, high quality, Ultra-detailed, 8k resolution, architecture photography, bright sunny day, clear blue sky, sharp shadows, vibrant colors, realistic materials, concrete, glass, wood, lush green landscaping.',
    negative: '(worst quality:1.4), (low quality:1.4), monochrome, flat lighting, overcast, rain, night, fog, distorted architecture, blurry, low resolution.',
  },
  {
    id: 'night',
    name: 'Night Cinematic',
    icon: '🌙',
    positive: '(Masterpiece:1.3), (photorealistic:1.4), best quality, high quality, Ultra-detailed, 8k resolution, architecture photography, cinematic night lighting, warm interior glow, cool exterior moonlight, long exposure, reflective surfaces, windows glowing, deep shadows, atmospheric.',
    negative: '(worst quality:1.4), (low quality:1.4), daylight, sun, bright sky, flat lighting, overexposed, low contrast, noisy, grainy.',
  },
  {
    id: 'perspective',
    name: 'Eye-Level',
    icon: '🚶',
    positive: '(Masterpiece:1.3), (photorealistic:1.4), Professional architectural exterior photography, eye-level perspective, human scale, street level view, corrected vertical lines, highly detailed facade, realistic street-side vegetation, 35mm lens, high dynamic range.',
    negative: '(worst quality:1.4), (low quality:1.4), bird view, high angle, looking down, interior, distorted lines, low-resolution, blurry trees, unrealistic shadows.',
  },
  {
    id: 'birdseye',
    name: 'Birds-Eye',
    icon: '🦅',
    positive: "(Masterpiece:1.3), (photorealistic:1.4), High-angle aerial photography, bird's-eye view, architectural masterplan perspective, expansive site context, looking down at the building, miniature effect, realistic surrounding urban fabric and lush landscaping, volumetric lighting.",
    negative: '(worst quality:1.4), (low quality:1.4), eye level, street view, interior, low angle view, looking up, distorted perspective, blurry background, dark lighting.',
  },
];

interface PromptPanelProps {
  positivePrompt: string;
  setPositivePrompt: (val: string) => void;
  negativePrompt: string;
  setNegativePrompt: (val: string) => void;
  originalPositivePrompt?: string | null;
  setOriginalPositivePrompt?: (val: string | null) => void;
  originalNegativePrompt?: string | null;
  setOriginalNegativePrompt?: (val: string | null) => void;
  showComparison?: boolean;
  setShowComparison?: (val: boolean) => void;
  showNegativeComparison?: boolean;
  setShowNegativeComparison?: (val: boolean) => void;
  handleImprovePrompt?: () => Promise<void>;
  handleImproveNegativePrompt?: () => Promise<void>;
  isImproving?: boolean;
  isImprovingNegative?: boolean;
  stylePresets?: StylePreset[];
}

const PromptPanel: React.FC<PromptPanelProps> = ({
  positivePrompt,
  setPositivePrompt,
  negativePrompt,
  setNegativePrompt,
  originalPositivePrompt: propsOriginalPositivePrompt,
  setOriginalPositivePrompt: propsSetOriginalPositivePrompt,
  originalNegativePrompt: propsOriginalNegativePrompt,
  setOriginalNegativePrompt: propsSetOriginalNegativePrompt,
  showComparison: propsShowComparison,
  setShowComparison: propsSetShowComparison,
  showNegativeComparison: propsShowNegativeComparison,
  setShowNegativeComparison: propsSetShowNegativeComparison,
  handleImprovePrompt: propsHandleImprovePrompt,
  handleImproveNegativePrompt: propsHandleImproveNegativePrompt,
  isImproving: propsIsImproving,
  isImprovingNegative: propsIsImprovingNegative,
  stylePresets = STYLE_PRESETS,
}) => {
  const [internalOriginalPositivePrompt, setInternalOriginalPositivePrompt] = useState<string | null>(null);
  const [internalOriginalNegativePrompt, setInternalOriginalNegativePrompt] = useState<string | null>(null);
  const [internalShowComparison, setInternalShowComparison] = useState(false);
  const [internalShowNegativeComparison, setInternalShowNegativeComparison] = useState(false);
  const [internalIsImproving, setInternalIsImproving] = useState(false);
  const [internalIsImprovingNegative, setInternalIsImprovingNegative] = useState(false);

  const originalPositivePrompt = propsOriginalPositivePrompt !== undefined ? propsOriginalPositivePrompt : internalOriginalPositivePrompt;
  const setOriginalPositivePrompt = propsSetOriginalPositivePrompt ?? setInternalOriginalPositivePrompt;
  const originalNegativePrompt = propsOriginalNegativePrompt !== undefined ? propsOriginalNegativePrompt : internalOriginalNegativePrompt;
  const setOriginalNegativePrompt = propsSetOriginalNegativePrompt ?? setInternalOriginalNegativePrompt;
  const showComparison = propsShowComparison !== undefined ? propsShowComparison : internalShowComparison;
  const setShowComparison = propsSetShowComparison ?? setInternalShowComparison;
  const showNegativeComparison = propsShowNegativeComparison !== undefined ? propsShowNegativeComparison : internalShowNegativeComparison;
  const setShowNegativeComparison = propsSetShowNegativeComparison ?? setInternalShowNegativeComparison;
  const isImproving = propsIsImproving !== undefined ? propsIsImproving : internalIsImproving;
  const isImprovingNegative = propsIsImprovingNegative !== undefined ? propsIsImprovingNegative : internalIsImprovingNegative;

  const handleImprovePrompt = async () => {
    if (propsHandleImprovePrompt) return propsHandleImprovePrompt();
    if (!positivePrompt.trim() || internalIsImproving) return;

    setInternalIsImproving(true);
    if (!originalPositivePrompt) setOriginalPositivePrompt(positivePrompt);

    try {
      const improved = await improvePositivePrompt(positivePrompt);
      if (improved) {
        setPositivePrompt(improved);
        setShowComparison(true);
      }
    } catch (err) {
      console.error('Improvement error:', err);
    } finally {
      setInternalIsImproving(false);
    }
  };

  const handleImproveNegativePrompt = async () => {
    if (propsHandleImproveNegativePrompt) return propsHandleImproveNegativePrompt();
    if (!negativePrompt.trim() || internalIsImprovingNegative) return;

    setInternalIsImprovingNegative(true);
    if (!originalNegativePrompt) setOriginalNegativePrompt(negativePrompt);

    try {
      const improved = await improveNegativePrompt(negativePrompt);
      if (improved) {
        setNegativePrompt(improved);
        setShowNegativeComparison(true);
      }
    } catch (err) {
      console.error('Negative improvement error:', err);
    } finally {
      setInternalIsImprovingNegative(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Style Presets */}
      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h2 className="text-sm font-medium text-[var(--color-text-primary)] font-mono uppercase tracking-wider">Quick Styles</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stylePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setPositivePrompt(preset.positive);
                setNegativePrompt(preset.negative);
                setOriginalPositivePrompt(null);
                setOriginalNegativePrompt(null);
                setShowComparison(false);
                setShowNegativeComparison(false);
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border)] rounded-xl hover:[border-color:var(--color-border-strong)] hover:[background:var(--color-bg-surface)] transition-all group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{preset.icon}</span>
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-tight">{preset.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Positive Prompt */}
      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
            <h2 className="text-sm font-medium text-[var(--color-success)] font-mono uppercase tracking-wider">Positive Prompt (CLIP Text Encode)</h2>
            <Tooltip text="나오길 원하는 것을 적으세요 (예: 푸른 하늘, 대리석 벽). 빈칸으로 두면 AI가 이미지를 분석해 알아서 그립니다.">
              <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] cursor-help" />
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {originalPositivePrompt && (
              <div className="flex bg-[var(--color-bg-surface-alt)] p-0.5 rounded-lg border border-[var(--color-border)] mr-2">
                <button
                  onClick={() => setShowComparison(false)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${!showComparison ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowComparison(true)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${showComparison ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}
                >
                  Improved
                </button>
              </div>
            )}
            <button
              onClick={handleImprovePrompt}
              disabled={isImproving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-success-bg)] hover:[background:var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)] rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Improve
            </button>
          </div>
        </div>
        <div className="relative">
          <textarea
            value={showComparison && originalPositivePrompt ? positivePrompt : (originalPositivePrompt || positivePrompt)}
            onChange={(e) => {
              if (showComparison && originalPositivePrompt) {
                setPositivePrompt(e.target.value);
              } else if (originalPositivePrompt) {
                setOriginalPositivePrompt(e.target.value);
              } else {
                setPositivePrompt(e.target.value);
              }
            }}
            className="w-full h-20 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg p-3 text-xs font-mono text-[var(--color-text-body)] focus:outline-none focus:[border-color:var(--color-success)] transition-colors resize-none"
            placeholder="Optional: Type here or leave blank for Auto-Pilot rendering..."
          />
          {showComparison && originalPositivePrompt && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-[var(--color-success-bg)] text-[var(--color-success)] text-[10px] font-bold rounded border border-[var(--color-success-border)] backdrop-blur-sm">
              AI ENHANCED
            </div>
          )}
        </div>
      </section>

      {/* Negative Prompt */}
      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
            <h2 className="text-sm font-medium text-[var(--color-danger)] font-mono uppercase tracking-wider">Negative Prompt (CLIP Text Encode)</h2>
            <Tooltip text="나오지 않기를 원하는 것을 적으세요 (예: 왜곡된 선, 사람, 자동차). Enhance 버튼을 눌러 품질을 높이세요.">
              <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] cursor-help" />
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {originalNegativePrompt && (
              <div className="flex bg-[var(--color-bg-surface-alt)] p-0.5 rounded-lg border border-[var(--color-border)] mr-2">
                <button
                  onClick={() => setShowNegativeComparison(false)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${!showNegativeComparison ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}
                >
                  Original
                </button>
                <button
                  onClick={() => setShowNegativeComparison(true)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${showNegativeComparison ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}
                >
                  Improved
                </button>
              </div>
            )}
            <button
              onClick={handleImproveNegativePrompt}
              disabled={isImprovingNegative || !negativePrompt.trim()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                isImprovingNegative
                  ? 'bg-[var(--color-bg-surface-alt)] text-[var(--color-text-subtle)] cursor-not-allowed'
                  : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger-border)] hover:[background:var(--color-danger-bg)]'
              }`}
            >
              {isImprovingNegative ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Refining...</>
              ) : (
                <><Shield className="w-3 h-3" /> Improve</>
              )}
            </button>
          </div>
        </div>
        <textarea
          value={showNegativeComparison && originalNegativePrompt ? negativePrompt : (originalNegativePrompt || negativePrompt)}
          onChange={(e) => {
            if (showNegativeComparison && originalNegativePrompt) {
              setNegativePrompt(e.target.value);
            } else if (originalNegativePrompt) {
              setOriginalNegativePrompt(e.target.value);
            } else {
              setNegativePrompt(e.target.value);
            }
          }}
          className="w-full h-14 bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg p-3 text-xs font-mono text-[var(--color-text-body)] focus:outline-none focus:[border-color:var(--color-danger)] transition-colors resize-none"
        />
        {showNegativeComparison && originalNegativePrompt && (
          <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[var(--color-danger)] opacity-70 font-medium italic">
            <Info className="w-2.5 h-2.5" />
            Viewing improved negative prompt. Switch to 'Original' to edit base keywords.
          </div>
        )}
      </section>
    </div>
  );
};

export default PromptPanel;
