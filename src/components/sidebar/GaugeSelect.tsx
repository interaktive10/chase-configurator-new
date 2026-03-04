import { useConfigStore } from '../../store/configStore';

const GAUGES = [
  { v: 24, l: '24 ga (.024") — Default' },
  { v: 20, l: '20 ga (.036")' },
  { v: 18, l: '18 ga (.048")' },
  { v: 16, l: '16 ga (.060")' },
  { v: 14, l: '14 ga (.075")' },
  { v: 12, l: '12 ga (.105")' },
  { v: 10, l: '10 ga (.135")' },
];

export function GaugeSelect() {
  const gauge = useConfigStore(s => s.gauge);
  const set = useConfigStore(s => s.set);
  return (
    <select
      className="gauge-select"
      value={gauge}
      onChange={e => set({ gauge: parseInt(e.target.value) as any })}
    >
      {GAUGES.map(g => (
        <option key={g.v} value={g.v}>{g.l}</option>
      ))}
    </select>
  );
}
