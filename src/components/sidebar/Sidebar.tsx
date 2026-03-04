import { } from 'react';
import { DimensionFields } from './DimensionField';
import { HoleSelector } from './HoleSelector';
import { CollarGroup } from './CollarGroup';
import { MaterialChips } from './MaterialChips';
import { GaugeSelect } from './GaugeSelect';
import { ToggleRow } from './ToggleRow';
import { PowderCoatSection } from './PowderCoatSection';
import { PriceDisplay } from './PriceDisplay';
import { CartRow } from './CartRow';
import { NotesField } from './NotesField';
import { useConfigStore } from '../../store/configStore';
import { PRICING } from '../../config';

interface SidebarProps {
  descExpanded: boolean;
  setDescExpanded: (v: boolean) => void;
  bdOpen: boolean;
  setBdOpen: (v: boolean) => void;
  onOpenRal: () => void;
  onAddToCart: () => void;
}

function fmt(n: number) { return '$' + n.toFixed(2); }

export function Sidebar({ descExpanded, setDescExpanded, bdOpen, setBdOpen, onOpenRal, onAddToCart }: SidebarProps) {
  const config = useConfigStore(s => s);
  const holes = config.holes;
  const pc = config.pc;

  // Price breakdown rows
  const base = PRICING.AREA_RATE * config.w * config.l + PRICING.LINEAR_RATE * (config.w + config.l) + PRICING.BASE_FIXED;
  const holeAmt = holes * PRICING.HOLE_PRICE;
  const skirtAmt = config.sk >= PRICING.SKIRT_THRESHOLD ? PRICING.SKIRT_SURCHARGE : 0;
  const pcAmt = pc ? PRICING.POWDER_COAT : 0;
  const subtotal = base + holeAmt + skirtAmt + pcAmt;
  const gaugeMult = PRICING.GAUGE_MULT[config.gauge] || 1;
  const matMult = PRICING.MATERIAL_MULT[config.mat] || 1;
  const total = subtotal * gaugeMult * matMult;

  const bdRows: { label: string; value: string; cls: string }[] = [
    { label: `Base Price (${config.w}" × ${config.l}")`, value: fmt(base), cls: 'bd-row' },
    { label: `${holes} Flue Hole${holes !== 1 ? 's' : ''}`, value: fmt(holeAmt), cls: 'bd-row' },
    ...(skirtAmt ? [{ label: 'Oversized Skirt Surcharge', value: fmt(skirtAmt), cls: 'bd-row' }] : []),
    ...(pcAmt ? [{ label: 'Powder Coating', value: fmt(pcAmt), cls: 'bd-row' }] : []),
    { label: 'Subtotal', value: fmt(subtotal), cls: 'bd-sub' },
    ...(gaugeMult !== 1 ? [{ label: `${config.gauge} ga Material`, value: '× ' + gaugeMult.toFixed(2), cls: 'bd-row' }] : []),
    ...(matMult !== 1 ? [{ label: config.mat === 'copper' ? 'Copper' : 'Galvanized Steel', value: '× ' + matMult.toFixed(2), cls: 'bd-row' }] : []),
    { label: 'TOTAL ESTIMATE', value: fmt(total), cls: 'bd-total' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-scroll">
        {/* Product Description */}
        <div className="product-desc">
          <h2>Chase Cover Configurator</h2>
          <div className={`product-desc-text${descExpanded ? ' expanded' : ''}`}>
            Kaminos chase covers are custom-fabricated to your exact measurements for a precise,
            weatherproof fit. Choose from premium galvanized steel or copper — each built to
            outlast and outperform standard covers. Add diagonal creases for improved water
            drainage and a drip edge for extra protection. Backed by our lifetime warranty
            against rust and corrosion.
          </div>
          <button className="desc-toggle" onClick={() => setDescExpanded(!descExpanded)}>
            {descExpanded ? 'Show Less' : 'Read More'}
          </button>
        </div>

        {/* Measurement Note */}
        <div className="measure-note">
          ⚠️ You must add an extra <strong>¼"</strong> to both the length and width measurements for proper
          fitment. If you need a custom shape, please <a href="https://kaminos.com/contact" target="_blank" rel="noreferrer">give us a call</a>.{' '}
          Need help measuring? <a href="https://kaminos.com/measuring-guide" target="_blank" rel="noreferrer">Click here</a>.
        </div>

        {/* Dimensions */}
        <div className="section">
          <div className="section-title">Cover Dimensions</div>
          <DimensionFields />
          <label className="centered-check" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              checked={config.showLabels}
              onChange={e => config.set({ showLabels: e.target.checked })}
            />
            Show Side Labels (Top / Right / Bottom / Left)
          </label>
        </div>

        {/* Options */}
        <div className="section">
          <div className="section-title">Options</div>
          <ToggleRow id="drip" label="Drip Edge" />
          <ToggleRow id="diag" label="Diagonal Crease" />
        </div>

        {/* Flue Holes */}
        <div className="section">
          <div className="section-title">Flue Holes</div>
          <HoleSelector />
          {holes >= 1 && <CollarGroup id="A" label="Hole 1 (Left)" />}
          {holes >= 2 && <CollarGroup id="B" label={holes === 2 ? 'Hole 2 (Right)' : 'Hole 2 (Middle)'} />}
          {holes === 3 && <CollarGroup id="C" label="Hole 3 (Right)" />}
        </div>

        {/* Material & Gauge */}
        <div className="section">
          <div className="section-title">Material &amp; Gauge</div>
          <MaterialChips />
          <div className="field-row" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Gauge</label>
              <GaugeSelect />
            </div>
          </div>
        </div>

        {/* Color Options — hidden for copper */}
        {config.mat !== 'copper' && (
          <div className="section">
            <div className="section-title">POWDER COATING</div>
            <ToggleRow id="pc" label="Color Options" />
            {pc && <PowderCoatSection onOpenRal={onOpenRal} />}
          </div>
        )}

        {/* Special Notes */}
        <div className="section">
          <div className="section-title">Special Notes</div>
          <NotesField />
        </div>
      </div>

      {/* Price Bar — fixed at bottom */}
      <div className="price-bar">
        <button
          className={`bd-toggle${bdOpen ? ' open' : ''}`}
          onClick={() => setBdOpen(!bdOpen)}
        >
          <span>{bdOpen ? '▼' : '▲'}</span> Price Breakdown
        </button>
        <div className={`bd-panel${bdOpen ? ' open' : ''}`}>
          {bdRows.map((row, i) => (
            <div key={i} className={row.cls}>
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
        <PriceDisplay />
        <CartRow onAddToCart={onAddToCart} />
      </div>
    </div>
  );
}
