'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, Loader2, Clipboard } from 'lucide-react';

interface MedicalNote {
  id: string;
  diagnosis: string;
  prescription: string;
  symptoms: string;
  advice: string;
  createdAt: string;
  patient: {
    name: string;
    phone: string;
  };
  appointment?: {
    appointmentNumber: string;
  };
}

export default function MedicalNotesPage() {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/doctor/medical-notes');
      const data = await res.json();
      if (res.ok && data.medicalNotes) {
        setNotes(data.medicalNotes);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.patient.name.toLowerCase().includes(query.toLowerCase()) ||
      note.diagnosis.toLowerCase().includes(query.toLowerCase()) ||
      note.prescription.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Prescriptions & Medical Notes</h1>
          <p className="text-muted-foreground mt-1">Review historic prescription notes, medical checkup reports, and symptoms details.</p>
        </div>

        {/* Search */}
        <div className="relative w-64 max-w-xs self-start">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search notes or patient..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-border bg-card min-h-[400px]">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Clipboard size={20} />
            </div>
            <p className="text-sm font-semibold">No prescriptions found.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Use the Patient EHR panel to write a prescription note for patient records.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredNotes.map((note) => (
              <div key={note.id} className="p-5 rounded-3xl border border-border bg-secondary/20 hover:bg-secondary/40 hover-card-trigger transition-all space-y-4">
                <div className="flex justify-between items-start border-b border-border/50 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">{note.patient.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Phone: {note.patient.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded font-bold">
                      {new Date(note.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Diagnosis</span>
                    <p className="text-xs font-semibold text-foreground mt-0.5">{note.diagnosis}</p>
                  </div>

                  {note.symptoms && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Symptoms</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{note.symptoms}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Prescription (Rx)</span>
                    <p className="text-xs font-medium text-foreground bg-teal-500/5 border border-teal-500/10 p-2.5 rounded-xl mt-1 leading-relaxed whitespace-pre-line">
                      {note.prescription}
                    </p>
                  </div>

                  {note.advice && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Advice & Instructions</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{note.advice}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
