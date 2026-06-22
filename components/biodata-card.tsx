"use client";

import * as React from "react";
import { format } from "date-fns";
import type { Biodata } from "@/lib/types";
import { ageFromDOB } from "@/lib/types";
import { formatHeight, formatINR, maskEmail, maskPhone } from "@/lib/utils";
import { Section, Field } from "./biodata-section";

export function BiodataCard({ biodata }: { biodata: Biodata }) {
  const [reveal, setReveal] = React.useState(false);
  React.useEffect(() => {
    if (!reveal) return;
    const id = setTimeout(() => setReveal(false), 30_000);
    return () => clearTimeout(id);
  }, [reveal]);

  return (
    <div>
      <Section index={0} title="Identity">
        <Field label="Full name">
          {biodata.firstName} {biodata.lastName}
        </Field>
        <Field label="Age" mono>
          {ageFromDOB(biodata.dateOfBirth)}
        </Field>
        <Field label="Date of birth" mono>
          {format(new Date(biodata.dateOfBirth), "d MMMM yyyy")}
        </Field>
        <Field label="Height" mono>{formatHeight(biodata.heightCm)}</Field>
        <Field label="Gender">{biodata.gender === "male" ? "Male" : "Female"}</Field>
        <Field label="Mother tongue">{biodata.motherTongue}</Field>
        <Field label="Languages">{biodata.languagesKnown.join(", ")}</Field>
        <Field label="Marital status">{biodata.maritalStatus}</Field>
      </Section>

      <Section index={1} title="Origins">
        <Field label="City">{biodata.city}</Field>
        <Field label="Country">{biodata.country}</Field>
        <Field label="Open to relocate">{biodata.openToRelocate}</Field>
        <Field label="Religion">{biodata.religion}</Field>
        <Field label="Caste">{biodata.caste}</Field>
        <Field label="Sub-caste">{biodata.subCaste ?? "—"}</Field>
        <Field label="Gotra">{biodata.gotra ?? "—"}</Field>
        <Field label="Manglik">{biodata.manglik}</Field>
      </Section>

      <Section index={2} title="Profession">
        <Field label="Education level">{biodata.educationLevel}</Field>
        <Field label="Degree">{biodata.degree}</Field>
        <Field label="College">{biodata.undergradCollege}</Field>
        <Field label="Designation">{biodata.designation}</Field>
        <Field label="Company">{biodata.currentCompany}</Field>
        <Field label="Annual income" mono>
          ₹ {formatINR(biodata.annualIncomeINR)}
        </Field>
      </Section>

      <Section index={3} title="Family">
        <Field label="Family type">{biodata.familyType}</Field>
        <Field label="Father's occupation">{biodata.fathersOccupation ?? "—"}</Field>
        <Field label="Mother's occupation">{biodata.mothersOccupation ?? "—"}</Field>
        <Field label="Siblings" mono>{biodata.siblings}</Field>
      </Section>

      <Section index={4} title="Lifestyle">
        <Field label="Diet">{biodata.diet}</Field>
        <Field label="Smoking">{biodata.smoking}</Field>
        <Field label="Drinking">{biodata.drinking}</Field>
        <Field label="Wants kids">{biodata.wantKids}</Field>
        <Field label="Open to pets">{biodata.openToPets}</Field>
      </Section>

      {biodata.bio && (
        <Section index={5} title="Bio">
          <Field label="In their words">
            <span className="text-body-l italic text-ink-warm">"{biodata.bio}"</span>
          </Field>
        </Section>
      )}

      <Section index={6} title="Partner preferences">
        <Field label="Age range" mono>
          {biodata.partnerPreferences.ageMin}–{biodata.partnerPreferences.ageMax}
        </Field>
        <Field label="Height range" mono>
          {biodata.partnerPreferences.heightMinCm}–{biodata.partnerPreferences.heightMaxCm} cm
        </Field>
        <Field label="Religion">
          {biodata.partnerPreferences.religions && biodata.partnerPreferences.religions.length > 0
            ? biodata.partnerPreferences.religions.join(", ")
            : "Open"}
        </Field>
        <Field label="Mother tongue">
          {biodata.partnerPreferences.motherTongues && biodata.partnerPreferences.motherTongues.length > 0
            ? biodata.partnerPreferences.motherTongues.join(", ")
            : "Open"}
        </Field>
        <Field label="Cities">
          {biodata.partnerPreferences.cities && biodata.partnerPreferences.cities.length > 0
            ? biodata.partnerPreferences.cities.join(", ")
            : "Open"}
        </Field>
        <Field label="Education (min)">{biodata.partnerPreferences.educationMin ?? "Open"}</Field>
        <Field label="Manglik">{biodata.partnerPreferences.acceptsManglik ?? "Doesn't matter"}</Field>
      </Section>

      <Section index={7} title="Contact">
        <Field label="Email">
          <span className="inline-flex items-center gap-3">
            <span className={reveal ? "" : "font-mono"}>{reveal ? biodata.email : maskEmail(biodata.email)}</span>
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion cursor-pointer"
            >
              {reveal ? "Hide" : "Reveal"}
            </button>
          </span>
        </Field>
        <Field label="Phone">
          <span className="inline-flex items-center gap-3">
            <span className="font-mono">{reveal ? biodata.phone : maskPhone(biodata.phone)}</span>
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-vermilion cursor-pointer"
            >
              {reveal ? "Hide" : "Reveal"}
            </button>
          </span>
        </Field>
        {reveal && (
          <Field label="">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
              Re-masks in 30 seconds.
            </span>
          </Field>
        )}
      </Section>
    </div>
  );
}
