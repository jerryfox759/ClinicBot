'use client';

import { useState, useEffect } from 'react';
import { Search, User, Phone, Calendar, Clipboard, Loader2, AlertCircle, Plus, HeartPulse } from 'lucide-react';

interface Appointment {
  id: string;
  appointmentNumber: string;
  date: string;
  timeSlot: string;
  status: string;
  reasonForVisit: string;
}

interface MedicalNote {
  id: string;
  diagnosis: string;
  prescription: string;
  symptoms: string;
  advice: string;
  createdAt: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address?: string;
  appointments: Appointment[];
  medicalNotes: MedicalNote[];
}

export default function PatientsPage() {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Note Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [advice, setAdvice] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [query]);

  const fetchPatients = async () => {
    try {
      const res = await fetch(`/api/doctor/patients?query=${query}`);
      const data = await res.json();
      if (res.ok && data.patients) {
        setPatients(data.patients);
        // Sync selected patient if already selected
        if (selectedPatient) {
          const updated = data.patients.find((p: Patient) => p.id === selectedPatient.id);
          if (updated) setSelectedPatient(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !diagnosis || !prescription) return;
    setSavingNote(true);
    setNoteSuccess(false);

    try {
      const res = await fetch('/api/doctor/medical-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          diagnosis,
          prescription,
          symptoms,
          advice,
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save note');
      }

      setDiagnosis('');
      setPrescription('');
      setSymptoms('');
      setAdvice('');
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 4000);
      
      // Reload patients to refresh notes list
      await fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Error saving medical note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Patient Records & EHR</h1>
        <p className="text-muted-foreground mt-1">Search patient clinical histories, view visit logs, and draft medical prescription charts.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Search & Patients list */}
        <div className="p-5 rounded-3xl border border-border bg-card flex flex-col h-[550px]">
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : patients.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-10">No patients found.</p>
            ) : (
              patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 ${
                    selectedPatient?.id === patient.id
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-secondary/20 hover:bg-secondary/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-muted-foreground">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{patient.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-0.5">
                      <Phone size={8} className="mr-1" /> {patient.phone}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Selected Patient EHR Details */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border bg-card h-[550px] overflow-y-auto">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Header profile card */}
              <div className="flex justify-between items-start pb-4 border-b border-border">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg">
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">{selectedPatient.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Gender: {selectedPatient.gender} • Age: {selectedPatient.age}y
                    </p>
                    {selectedPatient.address && <p className="text-[10px] text-slate-400 mt-0.5">{selectedPatient.address}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{selectedPatient.phone}</p>
                </div>
              </div>

              {/* Grid: EHR Logs and Notes form */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Notes & History */}
                <div className="space-y-6">
                  {/* Notes History */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                      <Clipboard size={12} className="mr-1.5" /> Medical Prescriptions ({selectedPatient.medicalNotes.length})
                    </h3>
                    {selectedPatient.medicalNotes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-3 border border-dashed border-border rounded-xl bg-secondary/10">No prescription history found.</p>
                    ) : (
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {selectedPatient.medicalNotes.map((note) => (
                          <div key={note.id} className="p-3.5 rounded-2xl border border-border bg-secondary/30 space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                              <span className="font-semibold">Visit Prescribed</span>
                              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">Diagnosis: <span className="font-medium text-slate-600 dark:text-slate-300">{note.diagnosis}</span></p>
                              <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-1">Rx: <span className="font-medium text-muted-foreground">{note.prescription}</span></p>
                              {note.symptoms && <p className="text-[10px] text-slate-400 mt-1">Symptoms: {note.symptoms}</p>}
                              {note.advice && <p className="text-[10px] text-slate-400 mt-0.5">Advice: {note.advice}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Appointment logs */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                      <Calendar size={12} className="mr-1.5" /> Consultations History
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedPatient.appointments.map((app) => (
                        <div key={app.id} className="p-2.5 rounded-xl border border-border bg-secondary/15 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-[11px] text-foreground">{new Date(app.date).toLocaleDateString()}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{app.reasonForVisit}</p>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            app.status === 'COMPLETED' ? 'bg-teal-500/10 text-teal-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Draft New Medical Note */}
                <div className="p-4 rounded-2xl border border-border bg-secondary/15 flex flex-col h-fit">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                    <Plus size={14} className="mr-1.5" /> Draft Consultation Note
                  </h3>
                  
                  {noteSuccess && (
                    <div className="p-2 rounded-xl bg-teal-500/10 text-[11px] text-teal-600 dark:text-teal-400 font-semibold mb-3 border border-teal-500/10">
                      Prescription note successfully saved to EHR!
                    </div>
                  )}

                  <form onSubmit={handleAddNote} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Diagnosis</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Essential Hypertension"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Symptoms / Presentation</label>
                      <input
                        type="text"
                        placeholder="e.g. Severe headache, BP 140/90"
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Prescription (Rx)</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Amlodipine 5mg OD x 30 days"
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Advice / Instructions</label>
                      <input
                        type="text"
                        placeholder="e.g. Low sodium diet, review in 1 month"
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingNote}
                      className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {savingNote && <Loader2 size={12} className="animate-spin" />}
                      <span>Save Prescription note</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-muted-foreground text-center">
              <div className="w-16 h-16 rounded-3xl bg-secondary/50 flex items-center justify-center mb-3">
                <HeartPulse size={28} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold">No patient selected.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose a patient profile from search index to explore EHR records.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
