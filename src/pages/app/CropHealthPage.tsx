import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Activity, AlertTriangle, Camera, CheckCircle2, FlaskConical, Leaf, Loader2, ShieldCheck, Upload } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import FormField from '@/components/ui/FormField';
import StatTile from '@/components/ui/StatTile';
import { useToast } from '@/components/ui/Toast';
import { useScanner } from '@/hooks/useScanner';
import { useAuth } from '@/context/AuthContext';
import { getCropScanHistory, saveCropScanHistory } from '@/services/scannerService';
import { createExpertCase, DEFAULT_EXPERT_MESSAGE } from '@/services/expertEscalationService';
import type { CropScanHistoryRow, ScannerResponse } from '@/services/types';

export default function CropHealthPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const scanner = useScanner();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState('');
  const [field, setField] = useState('');
  const [dragging, setDragging] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScannerResponse | null>(null);
  const [recentScans, setRecentScans] = useState<CropScanHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [expertRequested, setExpertRequested] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user?.id) { setRecentScans([]); return; }
    setHistoryLoading(true); setHistoryError(null);
    try { setRecentScans(await getCropScanHistory(user.id)); }
    catch (error) { setHistoryError(error instanceof Error ? error.message : 'Unable to load scan history.'); }
    finally { setHistoryLoading(false); }
  }, [user?.id]);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file.', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { toast('Image must be 10 MB or smaller.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => { setPreview(String(reader.result)); setCurrentScan(null); setExpertRequested(false); };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!preview) return;
    if (!crop.trim() || !field.trim()) { toast('Please provide both crop and field name.', 'error'); return; }
    try {
      const response = await scanner.mutate({ crop: crop.trim(), field: field.trim(), imageData: preview });
      setCurrentScan(response);
      if (user?.id) {
        try { await saveCropScanHistory(user.id, response.result); await loadHistory(); toast('Scan saved to your history.', 'success'); }
        catch (error) { toast(error instanceof Error ? error.message : 'Scan completed, but history could not be saved.', 'info'); }
      }
    } catch (error) { toast(error instanceof Error ? error.message : 'Analysis failed. Please try again.', 'error'); }
  };

  const analysis = currentScan?.analysis;
  const healthy = recentScans.filter(scan => scan.status === 'Healthy').length;
  const actionNeeded = Math.max(0, recentScans.length - healthy);
  const needsReview = Boolean(analysis?.disease) || Number(analysis?.diseaseConfidence ?? 0) < 70;

  return (
    <div className="space-y-6">
      <PageHeader icon={Leaf} title="Crop Health Scanner" subtitle="AI-assisted photo analysis for crop health observations and decision support." />
      <div className="grid sm:grid-cols-3 gap-4">
        <StatTile icon={ShieldCheck} label="Healthy Results" value={String(healthy)} sub="from saved scans" accent="from-brand-500 to-brand-700" />
        <StatTile icon={AlertTriangle} label="Needs Attention" value={String(actionNeeded)} sub="from saved scans" accent="from-amber-500 to-amber-600" delay={0.06} />
        <StatTile icon={Camera} label="Saved Scans" value={String(recentScans.length)} sub="in your account" accent="from-accent-500 to-accent-700" delay={0.12} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <GlassCard padding="lg" className="lg:col-span-2">
          <div className="font-display font-bold text-ink-900">Upload a crop photo</div>
          <div className="text-xs text-ink-600 mt-1">AI analysis is assistive and should not be treated as a confirmed diagnosis.</div>
          <div className="grid gap-3 sm:grid-cols-2 mt-4"><FormField label="Crop" name="crop" value={crop} onChange={setCrop} placeholder="Paddy" /><FormField label="Field name" name="field" value={field} onChange={setField} placeholder="Field 1" /></div>
          <div onDragOver={(event: DragEvent) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event: DragEvent) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files?.[0]); }} onClick={() => fileRef.current?.click()} className={`mt-5 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer ${dragging ? 'border-brand-500 bg-brand-50' : 'border-brand-200 bg-brand-50'}`}>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => handleFile(event.target.files?.[0])} />
            {preview ? <img src={preview} alt="Crop preview" className="mx-auto max-h-48 rounded-xl" /> : <><div className="mx-auto h-14 w-14 rounded-2xl bg-brand-600 grid place-items-center"><Upload size={26} className="text-white" /></div><div className="mt-3 font-semibold text-ink-900">Drag & drop or browse</div><div className="text-xs text-ink-600 mt-1">JPG / PNG · up to 10 MB</div></>}
          </div>
          {preview && <button onClick={analyze} disabled={scanner.loading} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 text-white px-5 py-3 text-sm font-bold disabled:opacity-60">{scanner.loading ? <><Loader2 size={17} className="animate-spin" /> Analyzing…</> : <><Activity size={17} /> Analyze Crop Health</>}</button>}
          {!user?.id && <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-700">Sign in to save scans and view your scan history.</div>}
        </GlassCard>

        <div className="lg:col-span-3 space-y-4">
          {scanner.loading && <GlassCard padding="lg" className="grid place-items-center py-14"><Loader2 size={32} className="animate-spin text-brand-600" /><div className="mt-3 text-sm font-semibold text-ink-600">Running AI-assisted analysis…</div></GlassCard>}
          {!scanner.loading && analysis && <>
            <GlassCard padding="lg" className="bg-brand-600 text-white border-0"><div className="text-brand-100 text-sm">Model confidence</div><div className="font-display font-extrabold text-4xl">{Number(analysis.overallConfidence ?? 0)}%</div><div className="text-xs text-brand-100 mt-2">Model confidence does not confirm a field diagnosis.</div></GlassCard>
            <div className="grid sm:grid-cols-2 gap-4">{[
              ['Disease observation', analysis.disease ?? 'No disease observed by the model', analysis.diseaseConfidence],
              ['Nutrient observation', analysis.nutrientDeficiency, analysis.nutrientConfidence],
              ['Water-stress observation', analysis.waterStress, analysis.waterConfidence],
              ['Pest-risk observation', analysis.pestRisk, analysis.pestConfidence],
            ].map(([label, value, confidence]) => <GlassCard key={String(label)} padding="md"><div className="text-[11px] font-bold uppercase tracking-wider text-ink-600">{label}</div><div className="text-sm font-bold text-ink-900 mt-1">{String(value)}</div><div className="mt-3 flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-ink-900/5 overflow-hidden"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Number(confidence ?? 0)}%` }} /></div><span className="text-[11px] font-bold text-brand-600">{Number(confidence ?? 0)}%</span></div></GlassCard>)}</div>
            <GlassCard padding="lg" className="bg-brand-50 border-brand-100"><div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-brand-600" /><div className="font-display font-bold text-ink-900">Recommended next step</div></div><p className="mt-2 text-sm text-ink-700 leading-relaxed">{analysis.recommendation}</p><p className="mt-3 text-xs text-ink-600">Verify treatment decisions with the product label and appropriate agricultural guidance such as TNAU/KVK advice.</p></GlassCard>
          </>}
          {!scanner.loading && !analysis && <GlassCard padding="lg" className="grid place-items-center py-16"><div className="text-center"><Camera size={30} className="mx-auto text-brand-600" /><div className="font-display font-bold text-ink-900 mt-3">Ready to scan</div><div className="text-sm text-ink-600 mt-1">Upload a crop photo to begin.</div></div></GlassCard>}
          {analysis && needsReview && <GlassCard padding="lg" className="border-amber-200 bg-amber-50/60"><div className="flex items-start gap-3"><ShieldCheck size={20} className="text-amber-700 mt-0.5" /><div className="flex-1"><div className="font-semibold text-ink-900">Consider expert verification</div><p className="text-xs text-amber-800 mt-1">{DEFAULT_EXPERT_MESSAGE}</p><button type="button" onClick={() => { createExpertCase('crop-disease', `Farmer requested expert review for ${crop} in ${field}. AI result: ${analysis.disease ?? 'low-confidence result'}.`); setExpertRequested(true); toast('Expert-review request prepared. Follow up with your local agricultural officer or KVK.', 'info'); }} disabled={expertRequested} className="mt-3 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{expertRequested ? 'Expert review requested' : 'Request expert review'}</button></div></div></GlassCard>}
        </div>
      </div>

      <GlassCard padding="lg"><div className="flex items-center gap-2"><FlaskConical size={18} className="text-brand-600" /><div><div className="font-display font-bold text-ink-900">Health history</div><div className="text-xs text-ink-600">Saved AI-assisted scan results from your account</div></div></div><div className="mt-5">{historyLoading ? <div className="text-sm text-ink-600">Loading scan history…</div> : historyError ? <div className="text-sm text-error-600">{historyError}</div> : recentScans.length === 0 ? <div className="text-sm text-ink-600">No saved scans yet.</div> : <div className="space-y-2">{recentScans.slice(0, 10).map(scan => <div key={scan.id} className="flex items-center justify-between rounded-xl border border-ink-900/5 p-3"><div><div className="font-semibold text-ink-900">{scan.crop} · {scan.field}</div><div className="text-xs text-ink-600">{scan.status}</div></div><div className="text-xs font-bold text-brand-600">{scan.confidence}%</div></div>)}</div>}</div></GlassCard>
    </div>
  );
}
