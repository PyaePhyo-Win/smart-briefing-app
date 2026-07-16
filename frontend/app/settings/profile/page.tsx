"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  LoaderCircle,
  Save,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";
import { SettingsShell } from "@/components/SettingsShell";
import { deleteProfilePhoto, updateUserProfile, uploadProfilePhoto } from "@/lib/api";
import { formatLocalDateTime } from "@/lib/dateTime";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isLoading, setAuthUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setDisplayName(user.display_name ?? "");
  }, [user]);

  const isInitializing = isLoading || !user;
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedDisplayName = displayName.trim().replace(/\s+/g, " ");
  const usernameError = normalizedUsername.length === 0
    ? t("settings.usernameRequired")
    : !USERNAME_PATTERN.test(normalizedUsername)
      ? t("settings.usernameInvalid")
      : null;
  const hasProfileChanges = useMemo(() => {
    if (!user) return false;
    return normalizedUsername !== user.username || (normalizedDisplayName || null) !== user.display_name;
  }, [normalizedDisplayName, normalizedUsername, user]);
  const planLabel = !user
    ? t("settings.unavailable")
    : user.plan === "free" ? t("settings.planFree") : user.plan === "pro" ? t("settings.planPro") : user.plan;
  const subscriptionLabel = !user
    ? t("settings.unavailable")
    : user.subscription_status === "active" ? t("settings.subscriptionActive")
      : user.subscription_status === "trialing" ? t("settings.subscriptionTrialing")
        : user.subscription_status === "past_due" ? t("settings.subscriptionPastDue")
          : user.subscription_status === "canceled" ? t("settings.subscriptionCanceled")
            : t("settings.subscriptionInactive");
  const identityLabel = user?.display_name || user?.username || user?.email || t("settings.unavailable");

  const toErrorMessage = (error: unknown) => error instanceof Error ? error.message : t("errors.backendUnreachable");
  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleProfileSave = async () => {
    if (!user || usernameError) return;
    clearMessages();
    setIsSavingProfile(true);
    try {
      const nextUser = await updateUserProfile({ username: normalizedUsername, display_name: normalizedDisplayName || null });
      setAuthUser(nextUser);
      setSuccessMessage(t("settings.profileSaved"));
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    clearMessages();
    setIsUploadingPhoto(true);
    try {
      const nextUser = await uploadProfilePhoto(file);
      setAuthUser(nextUser);
      setSuccessMessage(t("settings.photoUploaded"));
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!user?.profile_image_url) return;
    clearMessages();
    setIsRemovingPhoto(true);
    try {
      const nextUser = await deleteProfilePhoto();
      setAuthUser(nextUser);
      setSuccessMessage(t("settings.photoRemoved"));
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  return (
    <SettingsShell
      title={t("settings.profileTitle")}
      eyebrow={t("settings.accountBadge")}
      description={t("settings.profileDescription")}
      backHref="/settings"
      backLabel={t("settings.backToSettings")}
    >
      <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-7">
        {isInitializing ? (
          <div className="flex items-center gap-3 text-sm text-muted"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />{t("settings.loading")}</div>
        ) : (
          <div className="space-y-5">
            {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{errorMessage}</div> : null}
            {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">{successMessage}</div> : null}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
              <section className="rounded-[1.75rem] border border-line bg-paper p-5 shadow-soft">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-4">
                    {user.profile_image_url ? <Image src={user.profile_image_url} alt={t("settings.avatarAlt", { name: identityLabel })} width={80} height={80} className="h-20 w-20 rounded-full border border-line object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full border border-line bg-surface text-rust shadow-soft"><UserCircle className="h-10 w-10" aria-hidden="true" /></div>}
                    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.profilePhoto")}</p><p className="mt-2 text-sm font-semibold text-ink">{identityLabel}</p><p className="mt-1 text-xs leading-5 text-muted">{t("settings.photoRequirements")}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void handlePhotoSelection(event)} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto || isRemovingPhoto} className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60">
                      {isUploadingPhoto ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}{t("settings.uploadPhoto")}
                    </button>
                    <button type="button" onClick={() => void handlePhotoDelete()} disabled={!user.profile_image_url || isUploadingPhoto || isRemovingPhoto} className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-muted transition hover:border-rust hover:text-rust focus:outline-none focus:ring-4 focus:ring-rust/10 disabled:cursor-not-allowed disabled:opacity-60">
                      {isRemovingPhoto ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}{t("settings.removePhoto")}
                    </button>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block rounded-2xl border border-line bg-surface p-4"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.username")}</span><input type="text" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-3 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-rust" autoComplete="username" /><span className="mt-2 block text-xs leading-5 text-muted">{usernameError ?? t("settings.usernameHint")}</span></label>
                  <label className="block rounded-2xl border border-line bg-surface p-4"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.displayName")}</span><input type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-3 w-full rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-rust" autoComplete="name" /><span className="mt-2 block text-xs leading-5 text-muted">{t("settings.displayNameHint")}</span></label>
                </div>
                <div className="mt-4 flex justify-end"><button type="button" onClick={() => void handleProfileSave()} disabled={!hasProfileChanges || Boolean(usernameError) || isSavingProfile} className="inline-flex items-center gap-2 rounded-2xl border border-line-strong bg-ink px-4 py-3 text-sm font-semibold text-paper shadow-soft transition hover:-translate-y-0.5 hover:bg-rust focus:outline-none focus:ring-2 focus:ring-rust/30 disabled:cursor-not-allowed disabled:opacity-60">{isSavingProfile ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{isSavingProfile ? t("settings.saving") : t("settings.saveProfile")}</button></div>
              </section>
              <div className="space-y-4"><dl className="grid gap-4">
                <div className="rounded-2xl border border-line bg-paper p-4"><dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.email")}</dt><dd className="mt-2 break-words text-sm font-semibold text-ink">{user.email}</dd></div>
                <div className="rounded-2xl border border-line bg-paper p-4"><dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.userId")}</dt><dd className="mt-2 break-words text-sm font-semibold text-ink">{user.id}</dd></div>
                <div className="rounded-2xl border border-line bg-paper p-4"><dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.currentPlan")}</dt><dd className="mt-2 text-sm font-semibold text-ink">{planLabel}</dd></div>
                <div className="rounded-2xl border border-line bg-paper p-4"><dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.subscriptionStatus")}</dt><dd className="mt-2 text-sm font-semibold text-ink">{subscriptionLabel}</dd></div>
                <div className="rounded-2xl border border-line bg-paper p-4"><dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t("settings.renewsAt")}</dt><dd className="mt-2 text-sm font-semibold text-ink">{user.subscription_current_period_end ? formatLocalDateTime(user.subscription_current_period_end) : t("settings.unavailable")}</dd></div>
              </dl></div>
            </div>
          </div>
        )}
      </div>
    </SettingsShell>
  );
}
