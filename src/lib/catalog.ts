import { platforms } from "@/data/platforms";
import { products } from "@/data/products";
import type {
  MemoryGeneration,
  Platform,
  Product,
  ProductKind,
  Segment,
  Vendor,
} from "@/data/types";

export type CatalogFilters = {
  memory: MemoryGeneration | "all";
  query: string;
  vendor: Vendor | "all";
  segment: Segment | "all";
  kind: ProductKind | "all";
  pcieMin: 3 | 4 | 5 | 6;
  pcieMax: 3 | 4 | 5 | 6;
  thunderboltMin: 3 | 4 | 5;
  thunderboltMax: 3 | 4 | 5;
  oculink: boolean;
};

export const emptyFilters: CatalogFilters = {
  memory: "all",
  query: "",
  vendor: "all",
  segment: "all",
  kind: "all",
  pcieMin: 3,
  pcieMax: 6,
  thunderboltMin: 3,
  thunderboltMax: 5,
  oculink: false,
};

export function getPlatform(id: string): Platform | undefined {
  return platforms.find((platform) => platform.id === id);
}

export function platformsInGroup(socketGroup: string): Platform[] {
  return platforms
    .filter((platform) => platform.socketGroup === socketGroup)
    .sort((a, b) => a.year - b.year);
}

export function productsForPlatform(platformId: string): Product[] {
  return products.filter((product) => product.platformIds.includes(platformId));
}

export function productMemory(
  product: Product,
  platform: Platform,
): MemoryGeneration[] {
  return product.memory ?? platform.memory.map((item) => item.generation);
}

function thunderboltVersion(label: string | undefined): number | undefined {
  const match = label?.match(/Thunderbolt\s+(\d)/);
  return match ? Number(match[1]) : undefined;
}

function haystack(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function platformHaystack(platform: Platform): string {
  return haystack([
    platform.codename,
    platform.marketingName,
    platform.socket,
    platform.socketGroupLabel,
    platform.vendor,
    platform.segment,
    platform.chipsets.join(" "),
    platform.cpus.join(" "),
    platform.memory.map((item) => `${item.generation} ${item.details}`).join(" "),
    platform.note,
    platform.io.cpuPcie,
    platform.io.usbMax,
    platform.io.thunderbolt === "none"
      ? undefined
      : `thunderbolt ${platform.io.thunderboltVersion ?? ""}`,
  ]);
}

function productHaystack(product: Product): string {
  const oculink =
    product.kind === "mini-pc" || product.kind === "sbc"
      ? product.ports?.oculink
      : undefined;
  return haystack([
    product.brand,
    product.name,
    product.kind,
    product.note,
    product.memory?.join(" "),
    product.ports?.pcie,
    product.ports?.thunderbolt,
    product.ports?.usbC?.join(" "),
    oculink,
  ]);
}

function productPasses(
  product: Product,
  platform: Platform,
  filters: CatalogFilters,
): boolean {
  if (!product.platformIds.includes(platform.id)) return false;
  if (
    filters.memory !== "all" &&
    !productMemory(product, platform).includes(filters.memory)
  ) {
    return false;
  }
  if (filters.kind !== "all" && product.kind !== filters.kind) return false;
  if (filters.oculink) {
    const hasOculink =
      (product.kind === "mini-pc" || product.kind === "sbc") &&
      Boolean(product.ports?.oculink);
    if (!hasOculink) return false;
  }
  if (filters.thunderboltMin !== 3 || filters.thunderboltMax !== 5) {
    const listed = thunderboltVersion(product.ports?.thunderbolt);
    if (
      listed === undefined ||
      listed < filters.thunderboltMin ||
      listed > filters.thunderboltMax
    ) {
      return false;
    }
  }
  return true;
}

function platformPasses(platform: Platform, filters: CatalogFilters): boolean {
  if (
    filters.memory !== "all" &&
    !platform.memory.some((item) => item.generation === filters.memory)
  ) {
    return false;
  }
  if (filters.vendor !== "all" && platform.vendor !== filters.vendor) return false;
  if (filters.segment !== "all" && platform.segment !== filters.segment) {
    return false;
  }
  if (
    platform.io.pcieGen < filters.pcieMin ||
    platform.io.pcieGen > filters.pcieMax
  ) {
    return false;
  }
  if (filters.thunderboltMin !== 3 || filters.thunderboltMax !== 5) {
    const version = platform.io.thunderboltVersion;
    if (
      version === undefined ||
      version < filters.thunderboltMin ||
      version > filters.thunderboltMax
    ) {
      return false;
    }
  }
  return true;
}

export type CatalogGroup = {
  vendor: Vendor;
  socketGroup: string;
  label: string;
  platforms: Array<{ platform: Platform; products: Product[] }>;
};

export function searchCatalog(filters: CatalogFilters): CatalogGroup[] {
  const query = filters.query.trim().toLowerCase();
  const productScoped = filters.kind !== "all" || filters.oculink;
  const rows: Array<{ platform: Platform; products: Product[] }> = [];

  for (const platform of platforms) {
    if (!platformPasses(platform, filters)) continue;

    const matchedProducts = products.filter((product) =>
      productPasses(product, platform, filters),
    );
    const platformHit = query.length === 0 || platformHaystack(platform).includes(query);
    const hitProducts =
      query.length === 0
        ? matchedProducts
        : matchedProducts.filter((product) =>
            productHaystack(product).includes(query),
          );

    if (!platformHit && hitProducts.length === 0) continue;
    if (productScoped && (platformHit ? matchedProducts : hitProducts).length === 0) {
      continue;
    }

    rows.push({
      platform,
      products: platformHit ? matchedProducts : hitProducts,
    });
  }

  const groups = new Map<string, CatalogGroup>();
  for (const row of rows) {
    const key = `${row.platform.vendor}:${row.platform.socketGroup}`;
    const group = groups.get(key);
    if (group) {
      group.platforms.push(row);
      continue;
    }
    groups.set(key, {
      vendor: row.platform.vendor,
      socketGroup: row.platform.socketGroup,
      label: row.platform.socketGroupLabel,
      platforms: [row],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      platforms: group.platforms.sort((a, b) => a.platform.year - b.platform.year),
    }))
    .sort((a, b) => {
      if (a.vendor !== b.vendor) return a.vendor === "intel" ? -1 : 1;
      return a.platforms[0].platform.year - b.platforms[0].platform.year;
    });
}
