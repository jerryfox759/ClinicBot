'use client';

import { useState, useEffect } from 'react';
import { Settings, User, Building, MapPin, Phone, Globe, Loader2, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

export default function DoctorSettingsPage() {
  const [activeTab, setActiveTab] = useState<'chamber' | 'profile' | 'billing'>('chamber');

  // Chamber State
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  // Doctor Profile State
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');

  // Subscription State
  const [subscription, setSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // 1. Fetch Clinic Chamber settings
      const clinicRes = await fetch('/api/doctor/settings');
      const clinicData = await clinicRes.json();
      if (clinicRes.ok && clinicData.clinic) {
        setClinicName(clinicData.clinic.name);
        setClinicAddress(clinicData.clinic.address);
        setGoogleMapsUrl(clinicData.clinic.googleMapsUrl || '');
        setClinicPhone(clinicData.clinic.phone || '');
        setTimezone(clinicData.clinic.timezone || 'UTC');
      }

      // 2. Fetch Doctor profile details
      const profileRes = await fetch('/api/doctor/profile');
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.doctor) {
        setDoctorName(profileData.doctor.user.name);
        setSpecialty(profileData.doctor.specialty);
        setBio(profileData.doctor.bio || '');
      }

      // 3. Fetch Subscription details
      const subRes = await fetch('/api/doctor/subscription');
      const subData = await subRes.json();
      if (subRes.ok) {
        setSubscription(subData.subscription);
        setAvailablePlans(subData.plans || []);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChamber = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctor/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName,
          address: clinicAddress,
          googleMapsUrl,
          phone: clinicPhone,
          timezone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update chamber settings');

      setSuccessMsg('Chamber configuration saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: doctorName,
          specialty,
          bio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile settings');

      setSuccessMsg('Professional profile settings saved!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/doctor/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription');

      setSuccessMsg('Subscription updated successfully!');
      setSubscription(data.subscription);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Chamber & Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Configure clinic attributes, billing configurations, and professional profile contents.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-500/10 text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl border border-destructive/20 bg-destructive/10 text-xs font-semibold text-destructive flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          {/* Tab selector */}
          <div className="p-5 rounded-3xl border border-border bg-card h-fit space-y-2">
            <button
              onClick={() => setActiveTab('chamber')}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'chamber'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Building size={16} />
              <span>Chamber Configuration</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <User size={16} />
              <span>Doctor Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <CreditCard size={16} />
              <span>Billing & Subscriptions</span>
            </button>
          </div>

          {/* Form Pane */}
          <div className="md:col-span-3 p-6 rounded-3xl border border-border bg-card h-fit">
            {activeTab === 'chamber' && (
              <form onSubmit={handleSaveChamber} className="space-y-4">
                <div className="pb-3 border-b border-border mb-4">
                  <h2 className="text-base font-bold">Chamber / Clinic Profile</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Details display on patient WhatsApp confirmation texts.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chamber Name</label>
                    <input
                      type="text"
                      required
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chamber Hotline</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                        <Phone size={14} />
                      </span>
                      <input
                        type="text"
                        value={clinicPhone}
                        onChange={(e) => setClinicPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clinic Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                      <MapPin size={14} />
                    </span>
                    <input
                      type="text"
                      required
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      placeholder="Street Suite Address..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Google Maps Link</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground pointer-events-none">
                      <Globe size={14} />
                    </span>
                    <input
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1 w-full sm:w-1/2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Clinic Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all cursor-pointer text-foreground"
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center space-x-2 cursor-pointer disabled:opacity-50 text-foreground"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    <span>Save Chamber Configuration</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="pb-3 border-b border-border mb-4">
                  <h2 className="text-base font-bold">Doctor Personal Details</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage your credentials, bio specialty, and clinic profile details.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                    <input
                      type="text"
                      required
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Specialty / Title</label>
                    <input
                      type="text"
                      required
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Cardiologist, Pediatrician, etc."
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Professional Bio</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Provide a brief summary of your qualifications and clinical approach..."
                    className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-foreground"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center space-x-2 cursor-pointer disabled:opacity-50 text-foreground"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    <span>Save Professional profile</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="pb-3 border-b border-border mb-4">
                  <h2 className="text-base font-bold">Billing & SaaS Subscriptions</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage your pricing plans, view active details, and upgrade billing tiers.</p>
                </div>

                {/* Active Plan details */}
                <div className="p-5 rounded-2xl border border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      Active Plan
                    </span>
                    <h3 className="text-xl font-extrabold text-foreground mt-1">
                      {subscription?.plan?.name || 'No Subscription Plan'}
                    </h3>
                    {subscription && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Valid Until: <span className="font-bold text-foreground">{new Date(subscription.endDate).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 block">
                      ₹{subscription?.plan?.price || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">/ month</span>
                  </div>
                </div>

                {/* Pricing Tiers list */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upgrade / Select Pricing Tier</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {availablePlans.map((plan) => {
                      const isCurrent = subscription?.plan?.id === plan.id;
                      return (
                        <div
                          key={plan.id}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between h-48 ${
                            isCurrent
                              ? 'border-teal-500/30 bg-teal-500/5'
                              : 'border-border bg-card hover:bg-secondary/40'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-sm text-foreground">{plan.name}</span>
                              <span className="text-sm font-extrabold text-indigo-500">₹{plan.price}/mo</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Roster capacity of {plan.maxDoctors} doctors & {plan.maxAppointments} appts/mo.
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isCurrent || saving}
                            onClick={() => handleUpgradePlan(plan.id)}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 cursor-default'
                                : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 disabled:opacity-50 text-foreground'
                            }`}
                          >
                            {isCurrent ? 'Current Plan' : 'Select Plan'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

