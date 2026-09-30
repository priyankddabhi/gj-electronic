"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { DEVICE_TYPES } from "@/lib/constants";
import { MY_REPAIRS_KEY, saveId } from "@/lib/myTracking";
import PageHero from "@/components/PageHero";

const repairSchema = z.object({
  customerName: z.string().trim().min(2, "errors.name"),
  phone: z.string().refine((v) => normalizePhone(v) !== null, "errors.phone"),
  deviceType: z.string().min(1, "errors.device"),
  problemDescription: z.string().trim().min(5, "errors.problem"),
  preferredDate: z.string().optional(),
});

type RepairData = z.infer<typeof repairSchema>;

export default function BookRepairPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RepairData>({
    resolver: zodResolver(repairSchema),
  });

  const onSubmit = async (data: RepairData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const repair = await res.json();
      if (repair.trackingId) {
        saveId(MY_REPAIRS_KEY, repair.trackingId);
        router.push(`/track-repair?id=${encodeURIComponent(repair.trackingId)}&new=1`);
      } else {
        alert(t("common.error"));
      }
    } catch {
      alert(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <PageHero eyebrow={t("rich.pRepair")} title={t("repair.title")} />
    <div className="mx-auto max-w-xl px-4 py-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t("repair.name")} *
          </label>
          <input
            {...register("customerName")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.customerName && (
            <p className="mt-1 text-xs text-destructive">
              {t(errors.customerName.message ?? "")}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t("repair.phone")} *
          </label>
          <input
            {...register("phone")}
            type="tel"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-destructive">
              {t(errors.phone.message ?? "")}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t("repair.deviceType")} *
          </label>
          <select
            {...register("deviceType")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">{t("repair.selectDevice")}</option>
            {DEVICE_TYPES.map((d) => (
              <option key={d} value={d}>
                {t(`repair.devices.${d}`)}
              </option>
            ))}
          </select>
          {errors.deviceType && (
            <p className="mt-1 text-xs text-destructive">
              {t(errors.deviceType.message ?? "")}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t("repair.problem")} *
          </label>
          <textarea
            {...register("problemDescription")}
            rows={4}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.problemDescription && (
            <p className="mt-1 text-xs text-destructive">
              {t(errors.problemDescription.message ?? "")}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t("repair.preferredDate")}
          </label>
          <input
            {...register("preferredDate")}
            type="date"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? t("common.loading") : t("repair.submit")}
        </button>
      </form>
    </div>
    </>
  );
}
