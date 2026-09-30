import { create } from "zustand";

export interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface CustomerState {
  customer: CustomerInfo | null;
  loading: boolean;
  setCustomer: (customer: CustomerInfo) => void;
  checkSession: () => Promise<void>;
  login: (phone: string, password: string) => Promise<string | null>;
  register: (name: string, phone: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customer: null,
  loading: true,

  setCustomer: (customer) => set({ customer }),

  checkSession: async () => {
    try {
      const res = await fetch("/api/customer-auth");
      const data = await res.json();
      set({ customer: data.customer, loading: false });
    } catch {
      set({ customer: null, loading: false });
    }
  },

  login: async (phone, password) => {
    const res = await fetch("/api/customer-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", phone, password }),
    });
    const data = await res.json();
    if (data.error) return data.error;
    set({ customer: data });
    return null;
  },

  register: async (name, phone, password) => {
    const res = await fetch("/api/customer-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", name, phone, password }),
    });
    const data = await res.json();
    if (data.error) return data.error;
    set({ customer: data });
    return null;
  },

  logout: async () => {
    await fetch("/api/customer-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    set({ customer: null });
  },
}));
