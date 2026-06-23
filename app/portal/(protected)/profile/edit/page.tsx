import { ProfileEditForm } from "@/components/portal/profile-edit-form";

export default function PortalProfileEditPage() {
  return (
    <section>
      <h1 className="font-display text-display-m text-ink">Edit profile</h1>
      <p className="mt-2 text-ink-mute text-[14px]">
        Most changes save instantly. Identity, community, income, and profile photo updates are reviewed within 48 hours.
      </p>
      <div className="mt-10">
        <ProfileEditForm />
      </div>
    </section>
  );
}
