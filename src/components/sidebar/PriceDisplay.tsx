import { useConfigStore } from '../../store/configStore';

export function PriceDisplay() {
  const price = useConfigStore(s => s.price);
  return (
    <div className="price-display">
      <span className="price-label">Estimated Price</span>
      <span className="price-value">${price.toFixed(2)}</span>
    </div>
  );
}
