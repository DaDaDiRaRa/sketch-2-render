import React from 'react';
import { Info, Sparkles, Dices, RefreshCw } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface SettingsPanelProps {
  temperature: number;
  setTemperature: (val: number) => void;
  seedMode: 'random' | 'fixed';
  setSeedMode: (mode: 'random' | 'fixed') => void;
  seedValue: number;
  setSeedValue: (val: number) => void;
  lastUsedSeed?: number | null;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  temperature,
  setTemperature,
  seedMode,
  setSeedMode,
  seedValue,
  setSeedValue,
  lastUsedSeed = null,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-medium text-[var(--color-text-primary)] uppercase tracking-wider">창의성 수준</h2>
          <Tooltip text="AI가 얼마나 창의적으로 그릴지 결정합니다. 낮으면 원본에 충실하고, 높으면 배경과 조명이 화려해집니다.">
            <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] cursor-help" />
          </Tooltip>
        </div>
        <div className="space-y-4">
          <div className="flex bg-[var(--color-bg-surface-alt)] p-1 rounded-lg border border-[var(--color-border)]">
            {[
              { label: '보수', val: 0.2 },
              { label: '균형', val: 0.7 },
              { label: '창의', val: 1.2 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setTemperature(preset.val)}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                  temperature === preset.val
                    ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:[color:var(--color-text-body)]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">온도</label>
              <span className="text-[10px] font-mono text-[var(--color-accent)] font-bold">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <p className="text-[9px] text-[var(--color-text-faint)] font-medium italic px-1 flex items-center gap-1">
              <Info className="w-2.5 h-2.5" />
              낮을수록 정밀, 높을수록 창의적
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Dices className="w-4 h-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-medium text-[var(--color-text-primary)] uppercase tracking-wider">시드 제어</h2>
          <Tooltip text="이미지의 '고유 번호'입니다. 랜덤은 매번 새롭게, 고정(Fixed)은 마음에 드는 구도를 유지하며 수정할 때 씁니다.">
            <Info className="w-3.5 h-3.5 text-[var(--color-text-faint)] cursor-help" />
          </Tooltip>
        </div>
        <div className="space-y-4">
          <div className="flex bg-[var(--color-bg-surface-alt)] p-1 rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setSeedMode('random')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                seedMode === 'random'
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:[color:var(--color-text-body)]'
              }`}
            >
              랜덤
            </button>
            <button
              onClick={() => setSeedMode('fixed')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                seedMode === 'fixed'
                  ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:[color:var(--color-text-body)]'
              }`}
            >
              고정
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider ml-1">활성 시드</label>
            <div className="relative">
              <input
                type="number"
                value={seedMode === 'fixed' ? seedValue : (lastUsedSeed ?? '')}
                disabled={seedMode === 'random'}
                onChange={(e) => setSeedValue(parseInt(e.target.value) || 0)}
                className={`w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg p-2.5 text-xs font-mono transition-all focus:outline-none focus:[border-color:var(--color-accent)] ${
                  seedMode === 'random'
                    ? 'text-[var(--color-text-subtle)] cursor-not-allowed opacity-60'
                    : 'text-[var(--color-text-body)]'
                }`}
                placeholder={seedMode === 'random' ? '랜덤 생성 중...' : '고정 시드 입력...'}
              />
              {seedMode === 'random' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <RefreshCw className="w-3 h-3 text-[var(--color-text-subtle)] animate-spin-slow" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPanel;
