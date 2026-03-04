import { useConfigStore } from '../../store/configStore';

interface Props { onAddToCart: () => void; }

export function CartRow({ onAddToCart }: Props) {
  const quantity = useConfigStore(s => s.quantity);
  const set = useConfigStore(s => s.set);
  return (
    <div className="cart-row">
      <div className="qty-field">
        <label>Qty</label>
        <input
          type="number"
          min={1} max={99} step={1}
          value={quantity}
          onChange={e => set({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>
      <button className="add-to-cart" onClick={onAddToCart}>Add to Cart</button>
    </div>
  );
}
