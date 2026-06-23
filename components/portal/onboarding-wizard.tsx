"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingPhotoUpload } from "@/components/portal/onboarding-photo-upload";
import { OnboardingProgress } from "@/components/portal/onboarding-progress";
import { computeProfileCompleteness } from "@/lib/profile/completeness";
import { validateOnboardingStep } from "@/lib/onboarding/validate";
import type { Biodata } from "@/lib/types";

type OnboardingPayload = {
  customerId: string;
  biodata: Biodata;
  progress: {
    step: number | null;
    completeness: number;
    minCompleteness: number;
    completed: boolean;
  };
  options: {
    cities: string[];
    motherTongues: string[];
    religions: string[];
    castesByReligion: Record<string, string[]>;
    educationLevels: string[];
    diets: string[];
    maritalStatuses: string[];
    frequencies: string[];
    trinary: string[];
    genders: string[];
    manglik: string[];
    familyTypes: string[];
    stepLabels: string[];
  };
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full rounded-[2px] border border-ink/24 bg-paper-quiet px-[14px] text-[14px] text-ink"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [customerId, setCustomerId] = React.useState("");
  const [biodata, setBiodata] = React.useState<Biodata | null>(null);
  const [options, setOptions] = React.useState<OnboardingPayload["options"] | null>(null);
  const [completeness, setCompleteness] = React.useState(0);
  const [minCompleteness, setMinCompleteness] = React.useState(80);

  React.useEffect(() => {
    fetch("/api/client/onboarding")
      .then((r) => r.json())
      .then((d: OnboardingPayload) => {
        if (d.progress?.completed) {
          router.replace("/portal");
          return;
        }
        setCustomerId(d.customerId);
        setBiodata(d.biodata);
        setOptions(d.options);
        setStep(d.progress.step ?? 0);
        setCompleteness(d.progress.completeness);
        setMinCompleteness(d.progress.minCompleteness);
      })
      .catch(() => toast.error("Could not load your profile."))
      .finally(() => setLoading(false));
  }, [router]);

  React.useEffect(() => {
    if (biodata) setCompleteness(computeProfileCompleteness(biodata));
  }, [biodata]);

  function patch(fields: Partial<Biodata>) {
    if (!biodata) return;
    setBiodata((prev) =>
      prev
        ? {
            ...prev,
            ...fields,
            partnerPreferences: {
              ...prev.partnerPreferences,
              ...(fields.partnerPreferences ?? {}),
            },
          }
        : prev
    );
  }

  async function saveStep(nextStep: number, complete = false) {
    if (!biodata) return;

    const err = validateOnboardingStep(step, biodata);
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/client/onboarding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: nextStep, biodata, complete }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not save.");
        return;
      }
      setBiodata(data.biodata);
      setCompleteness(data.progress.completeness);
      if (complete || data.progress.completed) {
        toast.success("Your profile is ready.");
        router.replace("/portal");
        return;
      }
      setStep(nextStep);
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !biodata || !options) {
    return <p className="text-ink-mute italic">Loading your profile…</p>;
  }

  const stepCount = options.stepLabels.length;
  const castes = biodata.religion ? options.castesByReligion[biodata.religion] ?? [] : [];

  return (
    <section>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
        Step {step + 1} of {stepCount}
      </div>
      <h1 className="font-display text-display-m text-ink mt-3">{options.stepLabels[step]}</h1>
      <p className="mt-2 text-ink-warm text-[14px]">
        Tell us about yourself so your matchmaker can find the right introductions.
      </p>

      <OnboardingProgress
        step={step}
        stepCount={stepCount}
        completeness={completeness}
        minCompleteness={minCompleteness}
      />

      <div className="mt-10 space-y-5">
        {step === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First name</Label>
                <Input value={biodata.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={biodata.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
              </div>
            </div>
            <SelectField
              label="Gender"
              value={biodata.gender}
              onChange={(v) => patch({ gender: v as Biodata["gender"] })}
              options={options.genders}
            />
            <div>
              <Label>Date of birth</Label>
              <Input
                type="date"
                value={biodata.dateOfBirth.slice(0, 10)}
                onChange={(e) => patch({ dateOfBirth: new Date(e.target.value).toISOString() })}
              />
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input
                type="number"
                value={biodata.heightCm}
                onChange={(e) => patch({ heightCm: Number(e.target.value) })}
              />
            </div>
            <SelectField
              label="Marital status"
              value={biodata.maritalStatus}
              onChange={(v) => patch({ maritalStatus: v as Biodata["maritalStatus"] })}
              options={options.maritalStatuses}
            />
            <SelectField
              label="Mother tongue"
              value={biodata.motherTongue}
              onChange={(v) => patch({ motherTongue: v })}
              options={options.motherTongues}
            />
          </>
        )}

        {step === 1 && (
          <>
            <SelectField
              label="City"
              value={biodata.city === "—" ? "" : biodata.city}
              onChange={(v) => patch({ city: v })}
              options={options.cities}
            />
            <div>
              <Label>Country</Label>
              <Input value={biodata.country} onChange={(e) => patch({ country: e.target.value })} />
            </div>
            <SelectField
              label="Open to relocating"
              value={biodata.openToRelocate}
              onChange={(v) => patch({ openToRelocate: v as Biodata["openToRelocate"] })}
              options={options.trinary}
            />
          </>
        )}

        {step === 2 && (
          <div>
            <Label>Phone</Label>
            <Input
              type="tel"
              value={biodata.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
            <p className="mt-2 text-[12px] text-ink-mute">
              Email: {biodata.email}. SMS verification comes in a later update.
            </p>
          </div>
        )}

        {step === 3 && (
          <>
            <SelectField
              label="Education level"
              value={biodata.educationLevel}
              onChange={(v) => patch({ educationLevel: v as Biodata["educationLevel"] })}
              options={options.educationLevels}
            />
            <div>
              <Label>College</Label>
              <Input value={biodata.undergradCollege} onChange={(e) => patch({ undergradCollege: e.target.value })} />
            </div>
            <div>
              <Label>Degree</Label>
              <Input value={biodata.degree} onChange={(e) => patch({ degree: e.target.value })} />
            </div>
            <div>
              <Label>Company</Label>
              <Input value={biodata.currentCompany} onChange={(e) => patch({ currentCompany: e.target.value })} />
            </div>
            <div>
              <Label>Designation</Label>
              <Input value={biodata.designation} onChange={(e) => patch({ designation: e.target.value })} />
            </div>
            <div>
              <Label>Annual income (INR)</Label>
              <Input
                type="number"
                value={biodata.annualIncomeINR || ""}
                onChange={(e) => patch({ annualIncomeINR: Number(e.target.value) })}
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <SelectField
              label="Religion"
              value={biodata.religion}
              onChange={(v) => patch({ religion: v, caste: "" })}
              options={options.religions}
            />
            <SelectField
              label="Community / caste"
              value={biodata.caste}
              onChange={(v) => patch({ caste: v })}
              options={castes}
            />
            <SelectField
              label="Diet"
              value={biodata.diet}
              onChange={(v) => patch({ diet: v as Biodata["diet"] })}
              options={options.diets}
            />
            <SelectField
              label="Manglik"
              value={biodata.manglik}
              onChange={(v) => patch({ manglik: v as Biodata["manglik"] })}
              options={[...options.manglik]}
            />
            <SelectField
              label="Family type"
              value={biodata.familyType}
              onChange={(v) => patch({ familyType: v as Biodata["familyType"] })}
              options={[...options.familyTypes]}
            />
            <div>
              <Label>Siblings</Label>
              <Input
                type="number"
                min={0}
                value={biodata.siblings}
                onChange={(e) => patch({ siblings: Number(e.target.value) })}
              />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <SelectField
              label="Smoking"
              value={biodata.smoking}
              onChange={(v) => patch({ smoking: v as Biodata["smoking"] })}
              options={options.frequencies}
            />
            <SelectField
              label="Drinking"
              value={biodata.drinking}
              onChange={(v) => patch({ drinking: v as Biodata["drinking"] })}
              options={options.frequencies}
            />
            <SelectField
              label="Want kids"
              value={biodata.wantKids}
              onChange={(v) => patch({ wantKids: v as Biodata["wantKids"] })}
              options={options.trinary}
            />
            <SelectField
              label="Open to pets"
              value={biodata.openToPets}
              onChange={(v) => patch({ openToPets: v as Biodata["openToPets"] })}
              options={options.trinary}
            />
            <div>
              <Label>About you</Label>
              <Textarea
                value={biodata.bio ?? ""}
                onChange={(e) => patch({ bio: e.target.value })}
                className="min-h-[140px]"
                placeholder="A few sentences about who you are and what you are looking for."
              />
              <p className="mt-1 text-[12px] text-ink-mute">{(biodata.bio?.length ?? 0)}/40 characters minimum</p>
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Partner age min</Label>
                <Input
                  type="number"
                  value={biodata.partnerPreferences.ageMin ?? ""}
                  onChange={(e) =>
                    patch({
                      partnerPreferences: {
                        ...biodata.partnerPreferences,
                        ageMin: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label>Partner age max</Label>
                <Input
                  type="number"
                  value={biodata.partnerPreferences.ageMax ?? ""}
                  onChange={(e) =>
                    patch({
                      partnerPreferences: {
                        ...biodata.partnerPreferences,
                        ageMax: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[14px] text-ink-warm">
              <input
                type="checkbox"
                checked={biodata.partnerPreferences.openToOtherReligions ?? false}
                onChange={(e) =>
                  patch({
                    partnerPreferences: {
                      ...biodata.partnerPreferences,
                      openToOtherReligions: e.target.checked,
                    },
                  })
                }
              />
              Open to other religions
            </label>
            <div>
              <Label>Profile photo</Label>
              <div className="mt-2">
                <OnboardingPhotoUpload
                  customerId={customerId}
                  photoUrl={biodata.photoUrl}
                  onUploaded={(url) => patch({ photoUrl: url })}
                />
              </div>
              <div className="mt-4">
                <Label>Or paste photo URL</Label>
                <Input
                  value={biodata.photoUrl ?? ""}
                  onChange={(e) => patch({ photoUrl: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-12 flex items-center justify-between gap-4">
        <Button
          variant="quiet"
          disabled={step === 0 || saving}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < stepCount - 1 ? (
          <Button variant="accent" loading={saving} onClick={() => saveStep(step + 1)}>
            Continue
          </Button>
        ) : (
          <Button
            variant="accent"
            loading={saving}
            disabled={completeness < minCompleteness}
            onClick={() => saveStep(step, true)}
          >
            Finish profile
          </Button>
        )}
      </div>
      {step === stepCount - 1 && completeness < minCompleteness && (
        <p className="mt-4 text-[12px] text-ink-mute">
          Complete at least {minCompleteness}% of your profile to continue ({completeness}% now).
        </p>
      )}
    </section>
  );
}
