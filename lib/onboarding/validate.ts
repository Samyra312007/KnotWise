import type { Biodata } from "@/lib/types";
import { isValidPhone, normalizePhone } from "@/lib/profile/phone";

function validCity(city: string): boolean {
  const t = city.trim();
  return t.length > 0 && t !== "—";
}

export function sanitizeBiodataForSave(biodata: Biodata): Biodata {
  const phone = biodata.phone.trim() ? normalizePhone(biodata.phone) : biodata.phone;
  return {
    ...biodata,
    firstName: biodata.firstName.trim(),
    lastName: biodata.lastName.trim(),
    city: biodata.city.trim(),
    phone,
    bio: biodata.bio?.trim(),
    photoUrl: biodata.photoUrl?.trim(),
  };
}

export function validateOnboardingStep(step: number, biodata: Biodata): string | null {
  switch (step) {
    case 0:
      if (!biodata.firstName.trim()) return "Enter your first name.";
      if (!biodata.lastName.trim()) return "Enter your last name.";
      if (!biodata.gender) return "Select your gender.";
      if (!biodata.dateOfBirth) return "Enter your date of birth.";
      if (biodata.heightCm < 140 || biodata.heightCm > 220) return "Enter a height between 140 and 220 cm.";
      if (!biodata.maritalStatus) return "Select your marital status.";
      if (!biodata.motherTongue) return "Select your mother tongue.";
      return null;
    case 1:
      if (!validCity(biodata.city)) return "Select your city.";
      if (!biodata.country.trim()) return "Enter your country.";
      if (!biodata.openToRelocate) return "Select whether you are open to relocating.";
      return null;
    case 2:
      if (!isValidPhone(biodata.phone)) return "Enter a valid 10-digit Indian mobile number.";
      return null;
    case 3:
      if (!biodata.educationLevel) return "Select your education level.";
      if (!biodata.degree.trim()) return "Enter your degree.";
      if (!biodata.currentCompany.trim()) return "Enter your company.";
      if (!biodata.designation.trim()) return "Enter your designation.";
      if (biodata.annualIncomeINR <= 0) return "Enter your annual income.";
      return null;
    case 4:
      if (!biodata.religion) return "Select your religion.";
      if (!biodata.caste) return "Select your community.";
      if (!biodata.diet) return "Select your diet.";
      if (!biodata.manglik) return "Select manglik status.";
      if (!biodata.familyType) return "Select family type.";
      return null;
    case 5:
      if (!biodata.smoking) return "Select smoking preference.";
      if (!biodata.drinking) return "Select drinking preference.";
      if (!biodata.wantKids) return "Select whether you want kids.";
      if (!biodata.openToPets) return "Select whether you are open to pets.";
      if ((biodata.bio?.trim().length ?? 0) < 40) return "Write at least 40 characters about yourself.";
      return null;
    case 6: {
      const min = biodata.partnerPreferences.ageMin ?? 0;
      const max = biodata.partnerPreferences.ageMax ?? 0;
      if (min <= 0 || max <= 0 || max < min) return "Enter a valid partner age range.";
      if (!biodata.photoUrl?.trim()) return "Add a profile photo.";
      return null;
    }
    default:
      return null;
  }
}
