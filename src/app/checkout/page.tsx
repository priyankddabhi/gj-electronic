"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useCustomerStore } from "@/store/customer";
import { MY_ORDERS_KEY, saveId } from "@/lib/myTracking";
import PageHero from "@/components/PageHero";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "errors.name"),
  phone: z.string().refine((v) => normalizePhone(v) !== null, "errors.phone"),
  address: z.string().optional(),
  deliveryType: z.enum(["delivery", "pickup"]),
}).refine((data) => {
  if (data.deliveryType === "delivery") return !!data.address?.trim();
  return true;
}, { message: "errors.address", path: ["address"] });

type CheckoutData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setDeliveryCharge(Number(data.deliveryCharge) || 0))
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CheckoutData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryType: "delivery" },
  });

  // Logged-in customers: fill in their saved details, without overwriting anything already typed
  const customer = useCustomerStore((s) => s.customer);
  useEffect(() => {
    if (!customer) return;
    const fill = { customerName: customer.name, phone: customer.phone, address: customer.address };
    for (const [field, value] of Object.entries(fill) as [keyof typeof fill, string][]) {
      if (value && !getValues(field)) setValue(field, value, { shouldValidate: false });
    }
  }, [customer, getValues, setValue]);

  const deliveryType = watch("deliveryType");

  const onSubmit = async (data: CheckoutData) => {
    if (items.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      const order = await res.json();
      if (res.status === 409 && order.error) {
        alert(order.error);
      } else if (order.orderId) {
        saveId(MY_ORDERS_KEY, order.orderId);
        clearCart();
        router.push(`/track-order?id=${encodeURIComponent(order.orderId)}&new=1`);
      } else {
        alert(t("common.error"));
      }
    } catch {
      alert(t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">{t("cart.empty")}</p>
        <Link
          href="/products"
          className="mt-4 inline-block text-primary hover:underline"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <>
    <PageHero eyebrow={t("rich.pCheckout")} title={t("checkout.title")} />
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/cart"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("common.back")}
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            {t("checkout.name")} *
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
            {t("checkout.phone")} *
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
            {t("checkout.deliveryType")}
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                value="delivery"
                {...register("deliveryType")}
                className="accent-primary"
              />
              <span className="text-sm font-medium">{t("checkout.delivery")}</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                value="pickup"
                {...register("deliveryType")}
                className="accent-primary"
              />
              <span className="text-sm font-medium">{t("checkout.pickup")}</span>
            </label>
          </div>
        </div>

        {deliveryType === "delivery" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {t("checkout.address")} *
            </label>
            <textarea
              {...register("address")}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-destructive">{t(errors.address.message ?? "")}</p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 font-semibold">{t("checkout.orderSummary")}</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} x{item.quantity}
                </span>
                <span>
                  {t("common.rupee")}{item.price * item.quantity}
                </span>
              </div>
            ))}
            {deliveryType === "delivery" && deliveryCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("checkout.deliveryCharge")}</span>
                <span>{t("common.rupee")}{deliveryCharge}</span>
              </div>
            )}
            <div className="border-t border-border pt-2">
              <div className="flex justify-between font-bold">
                <span>{t("cart.total")}</span>
                <span>
                  {t("common.rupee")}
                  {getTotal() + (deliveryType === "delivery" ? deliveryCharge : 0)}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("checkout.paymentNote")}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? t("common.loading") : t("checkout.confirmOrder")}
        </button>
      </form>
    </div>
    </>
  );
}
