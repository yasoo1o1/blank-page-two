// Local price overrides for insurance offers (educational — localStorage only).
import { offers as baseOffers, type InsuranceOffer } from "@/data/insurance-offers";

const KEY = "arabbank_offer_prices_v1";
const listeners = new Set<() => void>();

type Overrides = Record<string, number>;

function read(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(o: Overrides) {
  localStorage.setItem(KEY, JSON.stringify(o));
  listeners.forEach((l) => l());
  // notify other tabs
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) listeners.forEach((l) => l());
  });
}

export function getEffectiveOffers(): InsuranceOffer[] {
  const o = read();
  return baseOffers.map((of) => (o[of.id] != null ? { ...of, price: o[of.id]! } : of));
}

export function getOverrides(): Overrides {
  return read();
}

export function setOfferPrice(id: string, price: number | null) {
  const o = read();
  if (price == null || Number.isNaN(price)) delete o[id];
  else o[id] = price;
  write(o);
}

export function resetAllPrices() {
  write({});
}

export function subscribeOfferPrices(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
