import { useState, useEffect } from 'react';
import { useConfigStore } from '../../store/configStore';

interface DimProps {
  configKey: 'w' | 'l' | 'sk';
  label: string;
  unit: string;
  max: number;
}

function DimInput({ configKey, label, unit, max }: DimProps) {
  const config = useConfigStore(s => s);
  const committed = config[configKey] as number;
  const [inputVal, setInputVal] = useState(committed.toString());
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setInputVal(committed.toString());
  }, [committed, focused]);

  function getDynamicMin(): number {
    if (configKey === 'sk') return 1;
    const gap = 1, edgeClear = 0.5;
    let minReq = 16;
    if (config.holes === 0) return minReq;
    const dA = config.collarA.dia;
    const dB = config.holes >= 2 ? config.collarB.dia : 0;
    const dC = config.holes === 3 ? config.collarC.dia : 0;
    if (configKey === 'l') {
      if (config.holes === 1) minReq = Math.max(minReq, dA + 2 * edgeClear);
      else if (config.holes === 2) minReq = Math.max(minReq, dA + dB + 2 * gap, 2 * dA + 4 * edgeClear, 2 * dB + 4 * edgeClear);
      else minReq = Math.max(minReq, 1.5 * (dA + dB) + 3 * gap, 1.5 * (dB + dC) + 3 * gap, 3 * dA + 6 * edgeClear, 3 * dC + 6 * edgeClear, dB + 2 * edgeClear);
    } else {
      minReq = Math.max(minReq, Math.max(dA, dB, dC) + 2 * edgeClear);
    }
    return minReq;
  }

  function commit() {
    setFocused(false);
    let raw = parseFloat(inputVal) || 0;
    raw = Math.round(raw * 8) / 8; // snap to eighths
    const clamped = Math.max(getDynamicMin(), Math.min(max, raw));
    setInputVal(clamped.toString());
    config.set({ [configKey]: clamped });
  }

  return (
    <div className="field">
      <label>{label} <span className="unit">({unit})</span></label>
      <input
        type="number"
        value={inputVal}
        step={0.125}
        style={{ color: focused ? '#3b6dd4' : undefined }}
        onFocus={() => setFocused(true)}
        onChange={e => setInputVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur(); } }}
      />
    </div>
  );
}

export function DimensionFields() {
  return (
    <div className="field-row-3">
      <DimInput configKey="w" label="Width" unit="in" max={60} />
      <DimInput configKey="l" label="Length" unit="in" max={120} />
      <DimInput configKey="sk" label="Skirt" unit="in" max={12} />
    </div>
  );
}
