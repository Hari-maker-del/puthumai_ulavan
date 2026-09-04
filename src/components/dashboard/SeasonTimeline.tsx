import Card from '@/components/ui/GlassCard';

export default function SeasonTimeline() {
  return (
    <Card padding="lg" className="h-full">
      <div className="font-display font-bold text-ink-900">Season Timeline</div>
      <div className="text-xs text-ink-600 mt-0.5">Timeline entries will appear when farm activities are recorded.</div>
      <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-ink-500">
        No activity timeline records are available yet. The report will not invent sowing, treatment or harvest events.
      </div>
    </Card>
  );
}
