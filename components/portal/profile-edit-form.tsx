"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfilePhotoGallery } from "@/components/portal/profile-photo-gallery";
import { SENSITIVE_FIELD_PATHS } from "@/lib/profile/fields";
import {
  CASTES_BY_RELIGION,
  DIETS,
  EDUCATION_LEVELS,
  FAMILY_TYPES,
  FREQUENCIES,
  GENDERS,
  MANGLIK,
  MARITAL_STATUSES,
  MOTHER_TONGUES,
  PROFILE_CITIES,
  RELIGIONS,
  TRINARY,
} from "@/lib/profile/options";
import type { Biodata } from "@/lib/types";

const SECTIONS = [
  { id: "about", label: "About you" },
  { id: "location", label: "Location" },
  { id: "contact", label: "Contact" },
  { id: "career", label: "Career" },
  { id: "background", label: "Background" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "preferences", label: "Preferences" },
  { id: "photos", label: "Photos" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

type PendingRevision = {
  id: string;
  fieldPath: string;
  newValue: string;
  status: string;
};

function SelectField({
  label,
  value,
  onChange,
  options,
  sensitive,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  sensitive?: boolean;
}) {
  return (
    <div>
      <Label>
        {label}
        {sensitive ? <span className="ml-2 text-vermilion font-mono text-[9px] uppercase">Review required</span> : null}
      </Label>
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

function pendingForField(pending: PendingRevision[], path: string): PendingRevision | undefined {
  return pending.find((p) => p.fieldPath === path && p.status === "pending");
}

function parsePendingValue(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export function ProfileEditForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [section, setSection] = React.useState<SectionId>("about");
  const [customerId, setCustomerId] = React.useState("");
  const [biodata, setBiodata] = React.useState<Biodata | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photos, setPhotos] = React.useState<Array<{ id: string; url: string; createdAt: string }>>([]);
  const [pending, setPending] = React.useState<PendingRevision[]>([]);

  const reload = React.useCallback(() => {
    return fetch("/api/client/profile")
      .then((r) => r.json())
      .then((d) => {
        setCustomerId(d.customerId ?? "");
        setBiodata(d.profile);
        setPhotoUrl(d.photoUrl ?? null);
        setPhotos(d.photos ?? []);
        setPending(d.pendingRevisions ?? []);
      });
  }, []);

  React.useEffect(() => {
    reload()
      .catch(() => toast.error("Could not load profile."))
      .finally(() => setLoading(false));
  }, [reload]);

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

  async function saveSection(payload: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not save.");
        return;
      }
      if (data.pending?.length) {
        toast.success("Sensitive changes submitted for review (within 48h).");
      } else {
        toast.success("Profile updated.");
      }
      await reload();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !biodata) {
    return <p className="text-ink-mute italic">Loading…</p>;
  }

  const castes = CASTES_BY_RELIGION[biodata.religion] ?? [];
  const pendingPhoto = pendingForField(pending, "photoUrl");
  const pendingPhotoUrl =
    pendingPhoto && typeof parsePendingValue(pendingPhoto.newValue) === "string"
      ? (parsePendingValue(pendingPhoto.newValue) as string)
      : undefined;

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-ink/12 pb-4 mb-8">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-2 border ${
              section === s.id ? "border-vermilion text-vermilion" : "border-ink/12 text-ink-mute"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {pending.length > 0 ? (
        <div className="mb-8 border border-amber-600/30 bg-amber-50/50 px-4 py-3 text-[14px] text-ink-warm">
          {pending.length} change{pending.length === 1 ? "" : "s"} awaiting matchmaker review.
        </div>
      ) : null}

      {section === "about" ? (
        <div className="grid gap-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                First name
                {SENSITIVE_FIELD_PATHS.has("firstName") ? (
                  <span className="ml-2 text-vermilion font-mono text-[9px] uppercase">Review required</span>
                ) : null}
              </Label>
              <Input value={biodata.firstName} onChange={(e) => patch({ firstName: e.target.value })} />
            </div>
            <div>
              <Label>
                Last name
                <span className="ml-2 text-vermilion font-mono text-[9px] uppercase">Review required</span>
              </Label>
              <Input value={biodata.lastName} onChange={(e) => patch({ lastName: e.target.value })} />
            </div>
          </div>
          <SelectField
            label="Gender"
            sensitive
            value={biodata.gender}
            onChange={(gender) => patch({ gender: gender as Biodata["gender"] })}
            options={GENDERS}
          />
          <div>
            <Label>
              Date of birth
              <span className="ml-2 text-vermilion font-mono text-[9px] uppercase">Review required</span>
            </Label>
            <Input
              type="date"
              value={biodata.dateOfBirth.slice(0, 10)}
              onChange={(e) => patch({ dateOfBirth: e.target.value })}
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
            sensitive
            value={biodata.maritalStatus}
            onChange={(maritalStatus) => patch({ maritalStatus: maritalStatus as Biodata["maritalStatus"] })}
            options={MARITAL_STATUSES}
          />
          <SelectField
            label="Mother tongue"
            value={biodata.motherTongue}
            onChange={(motherTongue) => patch({ motherTongue })}
            options={MOTHER_TONGUES}
          />
          <Button
            variant="quiet"
            disabled={saving}
            onClick={() =>
              saveSection({
                firstName: biodata.firstName,
                lastName: biodata.lastName,
                gender: biodata.gender,
                dateOfBirth: biodata.dateOfBirth,
                heightCm: biodata.heightCm,
                maritalStatus: biodata.maritalStatus,
                motherTongue: biodata.motherTongue,
              })
            }
          >
            Save about you
          </Button>
        </div>
      ) : null}

      {section === "location" ? (
        <div className="grid gap-4 max-w-lg">
          <SelectField label="City" value={biodata.city} onChange={(city) => patch({ city })} options={PROFILE_CITIES} />
          <div>
            <Label>Country</Label>
            <Input value={biodata.country} onChange={(e) => patch({ country: e.target.value })} />
          </div>
          <SelectField
            label="Open to relocate"
            value={biodata.openToRelocate}
            onChange={(openToRelocate) => patch({ openToRelocate: openToRelocate as Biodata["openToRelocate"] })}
            options={TRINARY}
          />
          <Button
            variant="quiet"
            disabled={saving}
            onClick={() =>
              saveSection({
                city: biodata.city,
                country: biodata.country,
                openToRelocate: biodata.openToRelocate,
              })
            }
          >
            Save location
          </Button>
        </div>
      ) : null}

      {section === "contact" ? (
        <div className="grid gap-4 max-w-lg">
          <div>
            <Label>Email</Label>
            <Input value={biodata.email} disabled className="opacity-60" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={biodata.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </div>
          <Button variant="quiet" disabled={saving} onClick={() => saveSection({ phone: biodata.phone })}>
            Save contact
          </Button>
        </div>
      ) : null}

      {section === "career" ? (
        <div className="grid gap-4 max-w-lg">
          <SelectField
            label="Education"
            value={biodata.educationLevel}
            onChange={(educationLevel) => patch({ educationLevel: educationLevel as Biodata["educationLevel"] })}
            options={EDUCATION_LEVELS}
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
            <Label>
              Annual income (INR)
              <span className="ml-2 text-vermilion font-mono text-[9px] uppercase">Review required</span>
            </Label>
            <Input
              type="number"
              value={biodata.annualIncomeINR}
              onChange={(e) => patch({ annualIncomeINR: Number(e.target.value) })}
            />
          </div>
          <Button
            variant="quiet"
            disabled={saving}
            onClick={() =>
              saveSection({
                educationLevel: biodata.educationLevel,
                undergradCollege: biodata.undergradCollege,
                degree: biodata.degree,
                currentCompany: biodata.currentCompany,
                designation: biodata.designation,
                annualIncomeINR: biodata.annualIncomeINR,
              })
            }
          >
            Save career
          </Button>
        </div>
      ) : null}

      {section === "background" ? (
        <div className="grid gap-4 max-w-lg">
          <SelectField
            label="Religion"
            sensitive
            value={biodata.religion}
            onChange={(religion) => patch({ religion, caste: "" })}
            options={RELIGIONS}
          />
          <SelectField
            label="Community"
            sensitive
            value={biodata.caste}
            onChange={(caste) => patch({ caste })}
            options={castes.length ? castes : ["Other"]}
          />
          <div>
            <Label>Sub-community</Label>
            <Input value={biodata.subCaste ?? ""} onChange={(e) => patch({ subCaste: e.target.value })} />
          </div>
          <div>
            <Label>Gotra</Label>
            <Input value={biodata.gotra ?? ""} onChange={(e) => patch({ gotra: e.target.value })} />
          </div>
          <SelectField
            label="Manglik"
            sensitive
            value={biodata.manglik}
            onChange={(manglik) => patch({ manglik: manglik as Biodata["manglik"] })}
            options={[...MANGLIK]}
          />
          <SelectField
            label="Family type"
            value={biodata.familyType}
            onChange={(familyType) => patch({ familyType: familyType as Biodata["familyType"] })}
            options={[...FAMILY_TYPES]}
          />
          <div>
            <Label>Siblings</Label>
            <Input
              type="number"
              value={biodata.siblings}
              onChange={(e) => patch({ siblings: Number(e.target.value) })}
            />
          </div>
          <Button
            variant="quiet"
            disabled={saving}
            onClick={() =>
              saveSection({
                religion: biodata.religion,
                caste: biodata.caste,
                subCaste: biodata.subCaste,
                gotra: biodata.gotra,
                manglik: biodata.manglik,
                familyType: biodata.familyType,
                siblings: biodata.siblings,
              })
            }
          >
            Save background
          </Button>
        </div>
      ) : null}

      {section === "lifestyle" ? (
        <div className="grid gap-4 max-w-lg">
          <SelectField
            label="Diet"
            value={biodata.diet}
            onChange={(diet) => patch({ diet: diet as Biodata["diet"] })}
            options={DIETS}
          />
          <SelectField
            label="Smoking"
            value={biodata.smoking}
            onChange={(smoking) => patch({ smoking: smoking as Biodata["smoking"] })}
            options={FREQUENCIES}
          />
          <SelectField
            label="Drinking"
            value={biodata.drinking}
            onChange={(drinking) => patch({ drinking: drinking as Biodata["drinking"] })}
            options={FREQUENCIES}
          />
          <SelectField
            label="Want kids"
            value={biodata.wantKids}
            onChange={(wantKids) => patch({ wantKids: wantKids as Biodata["wantKids"] })}
            options={TRINARY}
          />
          <SelectField
            label="Open to pets"
            value={biodata.openToPets}
            onChange={(openToPets) => patch({ openToPets: openToPets as Biodata["openToPets"] })}
            options={TRINARY}
          />
          <div>
            <Label>Bio</Label>
            <Textarea
              value={biodata.bio ?? ""}
              onChange={(e) => patch({ bio: e.target.value })}
              className="min-h-[140px]"
            />
          </div>
          <Button
            variant="quiet"
            disabled={saving}
            onClick={() =>
              saveSection({
                diet: biodata.diet,
                smoking: biodata.smoking,
                drinking: biodata.drinking,
                wantKids: biodata.wantKids,
                openToPets: biodata.openToPets,
                bio: biodata.bio,
              })
            }
          >
            Save lifestyle
          </Button>
        </div>
      ) : null}

      {section === "preferences" ? (
        <div className="grid gap-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Partner age min</Label>
              <Input
                type="number"
                value={biodata.partnerPreferences.ageMin ?? 24}
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
                value={biodata.partnerPreferences.ageMax ?? 35}
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
          <label className="flex items-center gap-2 text-[14px]">
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
          <Button
            variant="quiet"
            disabled={saving}
            onClick={() =>
              saveSection({
                partnerPreferences: biodata.partnerPreferences,
              })
            }
          >
            Save preferences
          </Button>
        </div>
      ) : null}

      {section === "photos" && customerId ? (
        <ProfilePhotoGallery
          customerId={customerId}
          photos={photos}
          primaryUrl={photoUrl}
          pendingPhotoUrl={pendingPhotoUrl}
          onChange={() => {
            reload().catch(() => undefined);
          }}
        />
      ) : null}

      <div className="mt-12 flex gap-4">
        <Button variant="quiet" onClick={() => router.push("/portal/profile")}>
          Back to profile
        </Button>
      </div>
    </div>
  );
}
