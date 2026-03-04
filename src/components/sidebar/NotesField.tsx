import { useConfigStore } from '../../store/configStore';

export function NotesField() {
  const notes = useConfigStore(s => s.notes);
  const set = useConfigStore(s => s.set);
  return (
    <textarea
      className="notes-textarea"
      rows={3}
      placeholder="Any special instructions, custom requests, or additional details…"
      value={notes}
      onChange={e => set({ notes: e.target.value })}
      autoComplete="off"
    />
  );
}
