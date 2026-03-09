import { useConfigStore } from '../../store/configStore';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  id: 'drip' | 'diag' | 'pc';
  label: string;
  tooltip?: string;
  defaultChecked?: boolean;
}

export function ToggleRow({ id, label, tooltip }: Props) {
  const config = useConfigStore(s => s);
  const checked = id === 'drip' ? config.drip : id === 'diag' ? config.diag : config.pc;

  function toggle() {
    if (id === 'drip') config.set({ drip: !config.drip });
    else if (id === 'diag') config.set({ diag: !config.diag });
    else config.set({ pc: !config.pc });
  }

  return (
    <div className="toggle-row">
      <span className="toggle-label" style={{ display: 'flex', alignItems: 'center' }}>
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </span>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={toggle} />
        <div className="toggle-track"></div>
        <div className="toggle-knob"></div>
      </label>
    </div>
  );
}

