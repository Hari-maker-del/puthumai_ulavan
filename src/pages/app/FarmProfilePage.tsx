import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  CheckCircle2,
  Edit3,
  FlaskConical,
  Layers3,
  MapPinned,
  Pencil,
  Plus,
  Sprout,
  Trash2,
  Waves,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatTile from '@/components/ui/StatTile';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { useFarms } from '@/hooks/useFarms';
import type { FarmRecord, FarmCreatePayload, FarmUpdatePayload } from '@/services/types';

const emptyForm = {
  name: '',
  location: '',
  crop: '',
  area: '0',
  health: '0',
  status: 'Active',
  description: '',
  soil_type: '',
  village: '',
  district: '',
  irrigation_type: '',
  notes: '',
};

export default function FarmProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { data, loading, error, refetch, create, update, remove } = useFarms(user?.id);
  const farms = useMemo(() => data ?? [], [data]);
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Farmer';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<FarmRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formError, setFormError] = useState<string | null>(null);

  const totalAcreage = useMemo(
    () => farms.reduce((sum, farm) => sum + Number(farm.area || 0), 0),
    [farms],
  );
  const activeFarms = useMemo(
    () => farms.filter((farm) => farm.status === 'Active').length,
    [farms],
  );
  const seasonsCompleted = useMemo(
    () => farms.filter((farm) => farm.status === 'Harvested').length,
    [farms],
  );
  const soilRecords = useMemo(
    () => farms.filter((farm) => Boolean(farm.soil_type)).length,
    [farms],
  );
  const totalHealth = useMemo(() => {
    const values = farms.map((farm) => Number(farm.health)).filter(Number.isFinite);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  }, [farms]);
  const uniqueCrops = useMemo(
    () => Array.from(new Set(farms.map((farm) => farm.crop).filter(Boolean))).sort(),
    [farms],
  );
  const filteredFarms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return farms.filter((farm) => {
      const matchesQuery = !query || `${farm.name} ${farm.crop} ${farm.location}`.toLowerCase().includes(query);
      const matchesCrop = cropFilter === 'All' || farm.crop === cropFilter;
      const matchesStatus = statusFilter === 'All' || farm.status === statusFilter;
      return matchesQuery && matchesCrop && matchesStatus;
    });
  }, [farms, cropFilter, search, statusFilter]);

  useEffect(() => {
    if (!user?.id) return;
    void refetch();
  }, [refetch, user?.id]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingFarm(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const openCreateModal = () => {
    setEditingFarm(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (farm: FarmRecord) => {
    setEditingFarm(farm);
    setFormError(null);
    setForm({
      name: farm.name,
      location: farm.location,
      crop: farm.crop,
      area: String(farm.area),
      health: String(farm.health),
      status: farm.status,
      description: farm.description ?? '',
      soil_type: farm.soil_type ?? '',
      village: farm.village ?? '',
      district: farm.district ?? '',
      irrigation_type: farm.irrigation_type ?? '',
      notes: farm.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    const name = form.name.trim();
    const location = form.location.trim();
    const crop = form.crop.trim();
    const area = Number(form.area || 0);
    const health = Number(form.health || 0);
    const status = form.status.trim() || 'Active';

    if (!name || !location || !crop) {
      setFormError('Farm name, location, and primary crop are required.');
      return;
    }
    if (!Number.isFinite(area) || area <= 0) {
      setFormError('Area must be greater than 0 acres.');
      return;
    }
    if (!Number.isFinite(health) || health < 0 || health > 100) {
      setFormError('Health must be between 0 and 100.');
      return;
    }

    const payload = {
      owner_id: user.id,
      name,
      location,
      crop,
      area,
      health,
      status,
      description: form.description.trim() || undefined,
      soil_type: form.soil_type.trim() || undefined,
      village: form.village.trim() || undefined,
      district: form.district.trim() || undefined,
      irrigation_type: form.irrigation_type.trim() || undefined,
      notes: form.notes.trim() || undefined,
    } satisfies FarmCreatePayload;

    try {
      setFormError(null);
      if (editingFarm) {
        const updatePayload: FarmUpdatePayload = payload;
        await update.mutate({ id: editingFarm.id, payload: updatePayload });
        toast('Farm updated successfully', 'success');
      } else {
        await create.mutate(payload);
        toast('Farm added successfully', 'success');
      }
      closeModal();
      void refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Unable to save farm', 'error');
    }
  };

  const handleDelete = async (farmId: string) => {
    if (!window.confirm('Delete this farm?')) return;
    try {
      await remove.mutate(farmId);
      toast('Farm deleted', 'success');
      void refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Unable to delete farm', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          icon={MapPinned}
          title="Farm Profile"
          subtitle="Your farm registry — land, crops, soil, irrigation and farming history in one place."
        />
        <Button variant="primary" size="sm" onClick={openCreateModal} className="gap-2 self-start sm:self-auto">
          <Plus size={16} /> Add Farm
        </Button>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white shadow-card"
      >
        <div className="relative p-5 sm:p-7">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-20 h-48 w-48 rounded-full bg-brand-300/10" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-extrabold shadow-card ring-1 ring-white/15">
                {initials || 'PU'}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-100">Farmer identity</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{displayName}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-brand-100">
                  <MapPinned size={14} />
                  {profile?.village ? `${profile.village}, ${profile.state ?? 'India'}` : 'Location not set'}
                </p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl lg:ml-auto">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-extrabold">{farms.length}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100">Farms</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-extrabold">{totalAcreage.toFixed(1)}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100">Acres</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-extrabold">{totalHealth}%</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100">Avg. health</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-extrabold">{memberSince}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-100">Member since</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Layers3} label="Total Land" value={`${totalAcreage.toFixed(1)} ac`} sub="registered in farms" accent="from-brand-500 to-brand-700" />
        <StatTile icon={Sprout} label="Active Farms" value={`${activeFarms}`} sub="currently active" accent="from-accent-500 to-accent-700" delay={0.05} />
        <StatTile icon={CalendarRange} label="Seasons Done" value={`${seasonsCompleted}`} sub="harvested records" accent="from-emerald-500 to-emerald-700" delay={0.1} />
        <StatTile icon={FlaskConical} label="Soil Records" value={`${soilRecords}`} sub="farms with soil type" accent="from-amber-500 to-amber-600" delay={0.15} />
      </div>

      <GlassCard padding="lg">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Master record</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-900">My Farm Registry</h2>
              <p className="mt-1 text-sm text-ink-600">Manage the permanent farm information used by the other Puthumai Uzhavan modules.</p>
            </div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{loading ? 'Loading…' : `${farms.length} registered`}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <FormField label="Search farms" name="search" value={search} onChange={setSearch} placeholder="Name, crop or location" />
            <FormField label="Crop" name="cropFilter" variant="select" value={cropFilter} onChange={setCropFilter} options={['All', ...uniqueCrops]} placeholder="All crops" />
            <FormField label="Status" name="statusFilter" variant="select" value={statusFilter} onChange={setStatusFilter} options={['All', 'Active', 'Planning', 'Idle', 'Harvested']} placeholder="All statuses" />
          </div>
        </div>

        <div className="mt-5">
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">{error}</div>
          ) : loading ? (
            <div className="grid gap-4 md:grid-cols-2"><CardSkeleton count={2} /></div>
          ) : filteredFarms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-ink-50/40 p-8 text-center">
              <Sprout className="mx-auto text-brand-500" size={28} />
              <h3 className="mt-3 font-semibold text-ink-900">{farms.length ? 'No farms match your filters' : 'No farms added yet'}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">{farms.length ? 'Try a different search or filter.' : 'Create your first farm record to start building your digital farm profile.'}</p>
              {!farms.length && <Button variant="primary" size="sm" onClick={openCreateModal} className="mt-4 gap-2"><Plus size={16} /> Add First Farm</Button>}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredFarms.map((farm, index) => {
                const health = Math.max(0, Math.min(100, Number(farm.health) || 0));
                const healthLabel = health >= 85 ? 'Healthy' : health >= 70 ? 'Watch' : 'Needs attention';
                return (
                  <motion.article
                    key={farm.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft transition hover:border-brand-200 hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                          <Sprout size={21} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg font-bold text-ink-900">{farm.name}</h3>
                          <p className="truncate text-xs text-ink-600">{farm.crop} · {Number(farm.area || 0).toFixed(1)} acres</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{farm.status}</span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-ink-50/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Location</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-900"><MapPinned size={14} className="text-brand-600" /> {farm.location}</p>
                      </div>
                      <div className="rounded-xl bg-ink-50/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Irrigation</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-900"><Waves size={14} className="text-blue-600" /> {farm.irrigation_type || 'Not recorded'}</p>
                      </div>
                      <div className="rounded-xl bg-ink-50/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Soil</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-900"><FlaskConical size={14} className="text-amber-600" /> {farm.soil_type || 'Not recorded'}</p>
                      </div>
                      <div className="rounded-xl bg-ink-50/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Health</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink-900"><CheckCircle2 size={14} className="text-emerald-600" /> {health}% · {healthLabel}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[11px] font-semibold text-ink-600"><span>Farm health record</span><span>{health}%</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-900/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${health}%` }} transition={{ duration: 0.7, delay: index * 0.04 }} className="h-full rounded-full bg-brand-600" />
                      </div>
                    </div>

                    {(farm.village || farm.district || farm.description) && (
                      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs leading-5 text-ink-700">
                        <span className="font-semibold text-ink-900">Record note:</span>{' '}
                        {[farm.village, farm.district].filter(Boolean).join(', ')}{farm.description ? `${farm.village || farm.district ? ' · ' : ''}${farm.description}` : ''}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-[11px] text-ink-500">Permanent farm record</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(farm)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-gray-50" aria-label={`Edit ${farm.name}`}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleDelete(farm.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100" aria-label={`Delete ${farm.name}`}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard padding="lg">
          <div className="mb-4 flex items-center gap-2">
            <Layers3 size={18} className="text-brand-600" />
            <div>
              <h2 className="font-display font-bold text-ink-900">Land Structure</h2>
              <p className="text-xs text-ink-600">A quick view of how your registered farms are distributed.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[10px] font-bold uppercase tracking-wider text-ink-500">
                  <th className="pb-3 pr-4">Farm</th><th className="pb-3 pr-4">Crop</th><th className="pb-3 pr-4">Area</th><th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {farms.length ? farms.map((farm) => (
                  <tr key={farm.id}>
                    <td className="py-3 pr-4 font-semibold text-ink-900">{farm.name}</td>
                    <td className="py-3 pr-4 text-ink-700">{farm.crop}</td>
                    <td className="py-3 pr-4 text-ink-700">{Number(farm.area || 0).toFixed(1)} ac</td>
                    <td className="py-3"><span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">{farm.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-8 text-center text-sm text-ink-500">No farm records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical size={18} className="text-amber-600" />
            <div>
              <h2 className="font-display font-bold text-ink-900">Soil & Farming Setup</h2>
              <p className="text-xs text-ink-600">Only stored profile values are shown here.</p>
            </div>
          </div>
          {farms.length ? (
            <div className="space-y-3">
              {farms.slice(0, 5).map((farm) => (
                <div key={farm.id} className="rounded-xl border border-gray-100 bg-ink-50/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink-900">{farm.name}</p>
                    <span className="text-[10px] font-semibold text-ink-500">{farm.area} ac</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-ink-500">Soil</span><p className="font-semibold text-ink-800">{farm.soil_type || 'Not recorded'}</p></div>
                    <div><span className="text-ink-500">Irrigation</span><p className="font-semibold text-ink-800">{farm.irrigation_type || 'Not recorded'}</p></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-ink-500">Add a farm to store soil and irrigation details.</div>
          )}
        </GlassCard>
      </div>

      <GlassCard padding="lg" className="bg-gradient-to-r from-brand-50 to-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Why this matters</p>
            <h2 className="mt-1 font-display text-lg font-bold text-ink-900">Your farm profile powers the rest of the platform</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-600">Farm Intelligence can analyze these records, Crop Recommendation can use crop history, and Weather can use the stored location — without turning this page into an analysis dashboard.</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-xs font-semibold text-brand-700 shadow-soft">
            <Edit3 size={15} className="mb-1" /> Keep records current
          </div>
        </div>
      </GlassCard>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingFarm ? 'Edit Farm Record' : 'Add Farm Record'}
        subtitle="Store the farm's permanent details for use across Puthumai Uzhavan."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={create.loading || update.loading || remove.loading}>
              {create.loading || update.loading ? 'Saving…' : editingFarm ? 'Save Changes' : 'Add Farm'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Farm name" name="name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} placeholder="e.g. Green Valley Farm" required />
          <FormField label="Location" name="location" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} placeholder="Village / District" required />
          <FormField label="Primary crop" name="crop" value={form.crop} onChange={(value) => setForm((prev) => ({ ...prev, crop: value }))} placeholder="Paddy" required />
          <FormField label="Area (acres)" name="area" type="number" value={form.area} onChange={(value) => setForm((prev) => ({ ...prev, area: value }))} placeholder="5" required />
          <FormField label="Soil type" name="soil_type" value={form.soil_type} onChange={(value) => setForm((prev) => ({ ...prev, soil_type: value }))} placeholder="Loamy / Clay / Red soil" />
          <FormField label="Irrigation type" name="irrigation_type" value={form.irrigation_type} onChange={(value) => setForm((prev) => ({ ...prev, irrigation_type: value }))} placeholder="Drip / Borewell / Canal" />
          <FormField label="Village" name="village" value={form.village} onChange={(value) => setForm((prev) => ({ ...prev, village: value }))} placeholder="Village name" />
          <FormField label="District" name="district" value={form.district} onChange={(value) => setForm((prev) => ({ ...prev, district: value }))} placeholder="District" />
          <FormField label="Health (%)" name="health" type="number" value={form.health} onChange={(value) => setForm((prev) => ({ ...prev, health: value }))} placeholder="0–100" required />
          <FormField label="Status" name="status" variant="select" value={form.status} onChange={(value) => setForm((prev) => ({ ...prev, status: value }))} options={['Active', 'Planning', 'Idle', 'Harvested']} placeholder="Select status" required />
          <div className="sm:col-span-2">
            <FormField label="Description" name="description" variant="textarea" value={form.description} onChange={(value) => setForm((prev) => ({ ...prev, description: value }))} placeholder="Purpose, land characteristics, crop notes…" />
          </div>
          <div className="sm:col-span-2">
            <FormField label="Notes" name="notes" variant="textarea" value={form.notes} onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))} placeholder="Additional permanent details" />
          </div>
          {formError && <div className="sm:col-span-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
        </div>
      </Modal>
    </div>
  );
}
