"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { normalizePhone } from "@/lib/phone";
import { DEVICE_TYPES } from "@/lib/constants";
import { MY_REPAIRS_KEY, saveId } from "@/lib/myTracking";
import { useCustomerStore } from "@/store/customer";
import PageHero from "@/components/PageHero";

const repairSchema = z.object({
  customerName: z.string().trim().min(2, "errors.name"),
  phone: z.string().refine((v) => normalizePhone(v) !== null, "errors.phone"),
  deviceType: z.string().min(1, "errors.device"),
  problemDescription: z.string().trim().min(5, "errors.problem"),

});

type RepairData = z.infer<typeof repairSchema>;

function BookRepairForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const isElectrician = params.get("service") === "electrician";
  const customer = useCustomerStore((s) => s.customer);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (imageUrls.length + files.length > 4) {
      alert("You can add up to 4 photos.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("file", f));
      const res = await fetch("/api/repair-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.urls) setImageUrls((prev) => [...prev, ...data.urls]);
      else alert(data.error || "Upload failed");
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (url: string) => setImageUrls((prev) => prev.filter((u) => u !== url));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RepairData>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      customerName: customer?.name ?? "",
      phone: customer?.phone ?? "",
      problemDescription: isElectrician ? "I need an electrician for home/office electrical work." : "",
    },
  });

  // Re-fill if customer logs in after the page mounts
  useEffect(() => {
    if (customer) {
      reset((prev) => ({
        ...prev,
        customerName: prev.customerName || customer.name,
        phone: prev.phone || customer.phone,
      }));
    }
  }, [customer, reset]);

  const onSubmit = async (data: RepairData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, images: imageUrls }),
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
    <PageHero
      eyebrow={isElectrician ? "Electrical Services" : t("rich.pRepair")}
      title={isElectrician ? "Book Electrician" : t("repair.title")}
      sub={isElectrician ? "Licensed electricians for home & office wiring, fitting, and repairs." : undefined}
    />
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

        {/* Photo upload */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Photos of the device <span className="text-muted-foreground font-normal">(optional, up to 4)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url) => (
              <div key={url} className="relative size-20 overflow-hidden rounded-lg border border-input">
                <Image src={url} alt="repair photo" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {imageUrls.length < 4 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
                {uploading ? "Uploading…" : "Add photo"}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleImages}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? t("common.loading") : t("repair.submit")}
        </button>
      </form>
    </div>
    </>
  );
}

export default function BookRepairPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading…</div>}>
      <BookRepairForm />
    </Suspense>
  );
}
