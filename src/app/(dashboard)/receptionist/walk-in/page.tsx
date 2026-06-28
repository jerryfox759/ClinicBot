'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Calendar, Clock, Loader2, Search, Plus, CheckCircle, Printer, AlertCircle } from 'lucide-react';

interface Doctor {
  id: string;
  specialty: string;
  consultationFee: number;
  user: {
    name: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookedAppointment {
  id: string;
  appointmentNumber: string;
  tokenNumber: number;
  timeSlot: string;
  date: string;
  patient: {
    name: string;
    phone: string;
    age: number;
    gender: string;
  };
  doctor: {
    user: {
      name: string;
    };
  };
}

export default function WalkInPage() {
  const router = useRouter();

  // Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Slots
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form State
  const [patientPhone, setPatientPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('MALE');
  const [patientAddress, setPatientAddress] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [reasonForVisit, setReasonForVisit] = useState('');

  // UI state
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [booking, setBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Receipt Modal State
  const [bookedReceipt, setBookedReceipt] = useState<BookedAppointment | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorId && bookingDate) {
      fetchSlots();
    }
  }, [selectedDoctorId, bookingDate]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/receptionist/doctors');
      const data = await res.json();
      if (res.ok && data.doctors) {
        setDoctors(data.doctors);
        if (data.doctors.length > 0) {
          setSelectedDoctorId(data.doctors[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    setSelectedSlot('');
    try {
      const res = await fetch(`/api/receptionist/slots?doctorId=${selectedDoctorId}&date=${bookingDate}`);
      const data = await res.json();
      if (res.ok && data.slots) {
        setSlots(data.slots);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleLookupPatient = async () => {
    if (!patientPhone) return;
    setSearchingPatient(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/receptionist/patients?phone=${patientPhone}`);
      const data = await res.json();
      if (res.ok && data.patient) {
        setPatientName(data.patient.name);
        setPatientAge(data.patient.age.toString());
        setPatientGender(data.patient.gender);
        setPatientAddress(data.patient.address || '');
      } else {
        setErrorMsg('No existing patient record found with this phone number. Please enter details manually.');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingPatient(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedSlot || !patientName || !patientPhone || !patientAge || !reasonForVisit) {
      setErrorMsg('Please fill in all required fields and select a time slot.');
      return;
    }
    setBooking(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/receptionist/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          patientName,
          patientPhone,
          patientAge,
          patientGender,
          patientAddress,
          date: bookingDate,
          timeSlot: selectedSlot,
          reasonForVisit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book appointment');

      // Clear Form on Success
      setPatientName('');
      setPatientPhone('');
      setPatientAge('');
      setPatientAddress('');
      setReasonForVisit('');
      setSelectedSlot('');
      
      // Load receipt
      setBookedReceipt(data.appointment);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during booking');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Receipt style */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-token-receipt, #print-token-receipt * {
            visibility: visible;
          }
          #print-token-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Walk-in Registration</h1>
        <p className="text-muted-foreground mt-1">Book new patients, check dynamic slot schedules, and generate token print receipts.</p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-semibold text-destructive flex items-center space-x-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleBookAppointment} className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Patient Details Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border bg-card space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-border">
            <User size={18} className="text-primary" />
            <h2 className="text-base font-bold">Patient Registration</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Phone Number (WhatsApp)*</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Phone size={14} />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookupPatient}
                  disabled={searchingPatient || !patientPhone}
                  className="px-3 py-2 bg-secondary text-foreground hover:bg-muted/30 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                >
                  {searchingPatient ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                  <span>Find</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Patient Full Name*</label>
              <input
                type="text"
                required
                placeholder="Ananya Roy"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Age (Years)*</label>
              <input
                type="number"
                required
                placeholder="28"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Gender*</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Address / Location</label>
            <input
              type="text"
              placeholder="Apartment suite, street address"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Reason for Visit / Symptoms*</label>
            <input
              type="text"
              required
              placeholder="e.g., Routine cardiac checkup, chest discomfort"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right Side: Doctor, Date & Slots selection */}
        <div className="p-6 rounded-3xl border border-border bg-card flex flex-col h-fit space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-border">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-base font-bold">Schedule Availability</h2>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Consulting Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.user.name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Booking Date</label>
            <input
              type="date"
              required
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Time slot grid */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Time Slot</span>
            {loadingSlots ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={20} /></div>
            ) : slots.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6 bg-secondary/20 border border-dashed border-border rounded-xl">No slots available on this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`py-2 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                      !slot.available
                        ? 'border-border bg-secondary/20 text-slate-400 line-through opacity-50 cursor-not-allowed'
                        : selectedSlot === slot.time
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                        : 'border-border bg-secondary/35 text-foreground hover:bg-secondary'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={booking || !selectedSlot || !patientName || !patientPhone}
            className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {booking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Booking...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Register & Book</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Booked Receipt Modal Popup */}
      {bookedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-center">
            {/* Stamp Icon */}
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} />
            </div>
            
            <h3 className="text-base font-bold text-foreground">Appointment Registered!</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Slip printed and saved to database.</p>

            <div id="print-token-receipt" className="my-5 p-5 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-secondary/15 text-left space-y-3">
              <div className="text-center pb-2 border-b border-border/80 mb-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Queue Ticket</h4>
                <h2 className="text-3xl font-black text-primary mt-1">#{bookedReceipt.tokenNumber}</h2>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-400">Appointment ID:</span><span className="font-semibold">{bookedReceipt.appointmentNumber}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Patient Name:</span><span className="font-semibold">{bookedReceipt.patient.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="font-semibold">{bookedReceipt.patient.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Doctor:</span><span className="font-semibold">{bookedReceipt.doctor.user.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Slot Time:</span><span className="font-semibold">{bookedReceipt.timeSlot}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Date:</span><span className="font-semibold">{new Date(bookedReceipt.date).toLocaleDateString()}</span></div>
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setBookedReceipt(null);
                  fetchSlots();
                }}
                className="w-1/2 py-2 border border-border hover:bg-secondary text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer size={12} />
                <span>Print Token</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
