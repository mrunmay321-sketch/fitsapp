import { useState } from 'react';
import { User, Ruler, Edit3, Check, Palette } from 'lucide-react';
import type { BodyMatrix as BodyType, SkinUndertone } from '../types';
import { UNDERTONES, UNDERTONE_LABELS, UNDERTONE_COLORS } from '../constants';
import { useWardrobe } from '../context/WardrobeContext';
import SectionHeader from '../components/SectionHeader';
import Modal from '../components/Modal';

const FIELDS: { key: keyof Omit<BodyType, 'undertone'>; label: string; unit: string }[] = [
  { key: 'height', label: 'Height', unit: 'cm' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'shoulder', label: 'Shoulder Width', unit: 'cm' },
  { key: 'waist', label: 'Waist', unit: 'cm' },
  { key: 'hips', label: 'Hips', unit: 'cm' },
];

const DEFAULT_BODY: BodyType = {
  height: 0,
  weight: 0,
  shoulder: 0,
  waist: 0,
  hips: 0,
  undertone: 'Neutral',
};

export default function BodyMatrix() {
  const { body, saveBody } = useWardrobe();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BodyType>(body ?? DEFAULT_BODY);

  const handleSave = async () => {
    await saveBody(form);
    setEditing(false);
  };

  const bmi = body && body.height > 0 ? body.weight / Math.pow(body.height / 100, 2) : null;

  return (
    <div className="px-5 pt-2">
      <SectionHeader
        title="Body Matrix"
        subtitle="Measurements · undertone · local"
        icon={<User className="h-5 w-5" strokeWidth={1.5} />}
        action={
          <button
            onClick={() => {
              setForm(body ?? DEFAULT_BODY);
              setEditing(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-stone-700/40 bg-stone-700/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-stone-500 transition hover:bg-stone-700/20"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Update
          </button>
        }
      />

      {/* BMI card */}
      {bmi !== null && (
        <div className="mb-4 rounded-2xl border border-stone-700/20 bg-gradient-to-br from-stone-700/10 to-stone-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                Body Mass Index
              </p>
              <p className="mt-1 font-mono text-3xl font-bold text-stone-600">
                {bmi.toFixed(1)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">
                Category
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {bmi < 18.5 ? 'Lean' : bmi < 25 ? 'Balanced' : bmi < 30 ? 'Athletic+' : 'Solid'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Skin undertone card */}
      {body && body.height > 0 && (
        <div className="mb-4 rounded-2xl border border-stone-700/20 bg-[#EDE9E3]/60 p-4">
          <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-600">
            <Palette className="h-3.5 w-3.5" />
            Skin Undertone
          </p>
          <p className="mb-3 text-sm font-semibold text-stone-800">
            {UNDERTONE_LABELS[body.undertone ?? 'Neutral']}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(UNDERTONE_COLORS[body.undertone ?? 'Neutral'] ?? []).map((c) => (
              <span
                key={c}
                className="rounded-md border border-[#C4BDB3] bg-[#FAF8F5]/60 px-2 py-1 font-mono text-[9px] tracking-wider text-stone-500"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Measurements */}
      {body && body.height > 0 ? (
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between rounded-xl border border-[#D6D0C8] bg-[#EDE9E3]/60 px-4 py-3.5"
            >
              <span className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider text-stone-500">
                <Ruler className="h-3.5 w-3.5 text-stone-400" />
                {f.label}
              </span>
              <span className="font-mono text-lg font-semibold text-stone-800">
                {body[f.key]}
                <span className="ml-1 text-xs font-normal text-stone-400">{f.unit}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#D6D0C8] bg-[#EDE9E3]/30 px-6 py-14 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D6D0C8] bg-[#EDE9E3]/60">
            <User className="h-8 w-8 text-stone-400" strokeWidth={1} />
          </div>
          <p className="text-sm font-medium text-stone-600">No measurements yet.</p>
          <p className="mt-1 text-xs text-stone-400">
            Set your body matrix for personalized styling recommendations.
          </p>
          <button
            onClick={() => {
              setForm(DEFAULT_BODY);
              setEditing(true);
            }}
            className="mt-5 flex items-center gap-2 rounded-xl border border-stone-700/40 bg-stone-700/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-stone-500 transition hover:bg-stone-700/20"
          >
            <Edit3 className="h-4 w-4" />
            Set Measurements
          </button>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Update Matrix">
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-stone-400">
                {f.label} ({f.unit})
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form[f.key] || ''}
                onChange={(e) =>
                  setForm({ ...form, [f.key]: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-full rounded-lg border border-[#D6D0C8] bg-[#FAF8F5]/80 px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-700/60 focus:shadow-[0_0_0_3px_rgba(120,113,108,0.15)]"
              />
            </div>
          ))}

          {/* Undertone selector */}
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-stone-400">
              Skin Undertone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {UNDERTONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, undertone: t })}
                  className={`rounded-lg border px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider transition ${
                    form.undertone === t
                      ? 'border-stone-700/50 bg-stone-700/10 text-stone-500'
                      : 'border-[#D6D0C8] bg-[#FAF8F5]/60 text-stone-400 hover:border-[#C4BDB3]'
                  }`}
                >
                  {UNDERTONE_LABELS[t].split(' (')[0]}
                </button>
              ))}
            </div>
            {form.undertone !== 'Neutral' && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(UNDERTONE_COLORS[form.undertone] ?? []).slice(0, 5).map((c) => (
                  <span
                    key={c}
                    className="rounded-md border border-[#C4BDB3]/50 bg-[#FAF8F5]/40 px-1.5 py-0.5 font-mono text-[8px] tracking-wider text-stone-400"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-700/40 bg-gradient-to-r from-stone-700/20 to-stone-500/20 py-3.5 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-stone-500 shadow-lg shadow-stone-700/20 transition hover:shadow-stone-700/40"
          >
            <Check className="h-4 w-4" />
            Save Matrix
          </button>
        </div>
      </Modal>
    </div>
  );
}
