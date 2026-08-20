// TasksCard shows an honest empty state until backend task data is available.

export default function TasksCard() {
  // Tasks should come from the backend (alerts/work-queue). Show honest empty state until available.
  return (
    <div className="bg-white rounded-xl shadow-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Today's Tasks</div>
        <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">Mark all read</button>
      </div>

      <div className="text-sm text-ink-600 py-8 text-center">No tasks available. Add your first farm and tasks will appear here.</div>
    </div>
  );
}
