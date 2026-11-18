"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  emptyFilters,
  searchCatalog,
  type CatalogFilters,
} from "@/lib/catalog";
import { productMemory } from "@/lib/catalog";
import {
  KIND_LABELS,
  MEMORY_GENERATIONS,
  SEGMENT_LABELS,
  type MemoryGeneration,
  type Product,
  type ProductKind,
  type Segment,
  type Vendor,
} from "@/data/types";


export function Catalog() {
  const [filters, setFilters] = useState<CatalogFilters>(emptyFilters);
  const groups = useMemo(() => searchCatalog(filters), [filters]);
  const platformCount = groups.reduce((sum, group) => sum + group.platforms.length, 0);

  function patch(next: Partial<CatalogFilters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <aside className="flex w-full shrink-0 flex-col gap-4 md:sticky md:top-8 md:w-56">
        <MemoryFilter
          value={filters.memory}
          onChange={(memory) => patch({ memory })}
        />
        <div className="flex gap-2">
          {(["intel", "amd"] as const).map((vendor) => {
            const selected = filters.vendor === vendor;
            return (
              <button
                key={vendor}
                type="button"
                aria-pressed={selected}
                onClick={() => patch({ vendor: selected ? "all" : vendor })}
                className={`flex h-12 flex-1 items-center justify-center rounded-full border px-4 text-sm font-medium ${
                  selected
                    ? "border-transparent bg-foreground text-background"
                    : "border-black/[.08] hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                }`}
              >
                {vendor === "intel" ? "Intel" : "AMD"}
              </button>
            );
          })}
        </div>
        <Select
          label="Platform segment"
          value={filters.segment}
          onChange={(segment) => patch({ segment: segment as Segment | "all" })}
          options={[
            ["all", "All platform segments"],
            ...(
              Object.entries(SEGMENT_LABELS) as Array<[Segment, string]>
            ).map(([value, label]) => [value, label] as const),
          ]}
        />
        <Select
          label="Product kind"
          value={filters.kind}
          onChange={(kind) => patch({ kind: kind as ProductKind | "all" })}
          options={[
            ["all", "All product kinds"],
            ...(
              Object.entries(KIND_LABELS) as Array<[ProductKind, string]>
            ).map(([value, label]) => [value, label] as const),
          ]}
        />
        <RangeBar
          label="PCIe"
          min={filters.pcieMin}
          max={filters.pcieMax}
          floor={3}
          ceiling={6}
          onChange={(pcieMin, pcieMax) =>
            patch({
              pcieMin: pcieMin as 3 | 4 | 5 | 6,
              pcieMax: pcieMax as 3 | 4 | 5 | 6,
            })
          }
        />
        <RangeBar
          label="Thunderbolt"
          min={filters.thunderboltMin}
          max={filters.thunderboltMax}
          floor={3}
          ceiling={5}
          onChange={(thunderboltMin, thunderboltMax) =>
            patch({
              thunderboltMin: thunderboltMin as 3 | 4 | 5,
              thunderboltMax: thunderboltMax as 3 | 4 | 5,
            })
          }
        />
        <button
          type="button"
          aria-pressed={filters.oculink}
          onClick={() => patch({ oculink: !filters.oculink })}
          className={`flex h-12 items-center justify-center rounded-full border px-4 text-sm font-medium ${
            filters.oculink
              ? "border-transparent bg-foreground text-background"
              : "border-black/[.08] hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          }`}
        >
          Oculink
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Search</span>
        <input
          value={filters.query}
          onChange={(event) => patch({ query: event.target.value })}
          placeholder="Generation, socket, chipset, CPU, or product"
          className="h-12 rounded-full border border-black/[.08] bg-transparent px-4 text-black outline-none dark:border-white/[.145] dark:text-zinc-50"
        />
      </label>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {platformCount} {platformCount === 1 ? "platform" : "platforms"}
      </p>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/[.08] px-4 py-8 text-center text-sm text-zinc-600 dark:border-white/[.145] dark:text-zinc-400">
          Nothing in the starter slice matches these filters.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {groups.map((group, index) => {
            const showVendor = index === 0 || groups[index - 1].vendor !== group.vendor;
            return (
              <section key={`${group.vendor}-${group.socketGroup}`} className="flex flex-col gap-3">
                {showVendor ? (
                  <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {group.vendor === "intel" ? "Intel" : "AMD"}
                  </h2>
                ) : null}
                <h3 className="text-sm font-medium">{group.label}</h3>
                <ul className="flex flex-col gap-3">
                  {group.platforms.map(({ platform, products: rows }) => (
                    <li
                      key={platform.id}
                      className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          href={`/platforms/${platform.id}`}
                          className="font-medium text-black underline-offset-4 hover:underline dark:text-zinc-50"
                        >
                          {platform.marketingName}
                          <span className="ml-2 font-normal text-zinc-600 dark:text-zinc-400">
                            {platform.codename}
                          </span>
                        </Link>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {platform.year}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {SEGMENT_LABELS[platform.segment]} · {platform.socket} · PCIe{" "}
                        {platform.io.pcieGen}
                        {platform.io.thunderboltVersion
                          ? ` · Thunderbolt ${platform.io.thunderboltVersion}`
                          : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {platform.memory.map((item) => (
                          <span
                            key={item.generation}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${memoryChipClass(item.generation, filters.memory)}`}
                          >
                            {item.generation}
                          </span>
                        ))}
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {platform.chipsets.join(", ")}
                        </span>
                      </div>
                      {rows.length > 0 ? (
                        <ul className="mt-3 flex flex-col gap-1 border-t border-black/[.08] pt-3 text-sm dark:border-white/[.145]">
                          {rows.map((product) => (
                            <ProductLine
                              key={product.id}
                              product={product}
                              memory={productMemory(product, platform)}
                            />
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

function ProductLine({
  product,
  memory,
}: {
  product: Product;
  memory: MemoryGeneration[];
}) {
  const oculink =
    product.kind === "mini-pc" || product.kind === "sbc"
      ? product.ports?.oculink
      : undefined;
  return (
    <li>
      <span className="text-zinc-600 dark:text-zinc-400">{KIND_LABELS[product.kind]}</span>
      {" · "}
      {product.brand} {product.name}
      {" · "}
      {memory.join(" + ")}
      {product.ports?.thunderbolt ? ` · ${product.ports.thunderbolt}` : ""}
      {oculink ? ` · ${oculink}` : ""}
    </li>
  );
}

function MemoryFilter({
  value,
  onChange,
}: {
  value: MemoryGeneration | "all";
  onChange: (value: MemoryGeneration | "all") => void;
}) {
  return (
    <div className="flex gap-2">
      {MEMORY_GENERATIONS.map((generation) => {
        const selected = value === generation;
        return (
          <button
            key={generation}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? "all" : generation)}
            className={`flex h-12 flex-1 items-center justify-center rounded-full border px-2 text-sm font-medium ${
              selected
                ? "border-transparent bg-foreground text-background"
                : "border-black/[.08] hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            }`}
          >
            {generation}
          </button>
        );
      })}
    </div>
  );
}

function RangeBar({
  label,
  min,
  max,
  floor,
  ceiling,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  floor: number;
  ceiling: number;
  onChange: (min: number, max: number) => void;
}) {
  const span = ceiling - floor;
  const start = ((min - floor) / span) * 100;
  const end = ((max - floor) / span) * 100;
  const steps = Array.from({ length: ceiling - floor + 1 }, (_, index) => floor + index);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">
        {label} {min === max ? min : `${min}–${max}`}
      </span>
      <div className="relative h-4">
        <div className="absolute top-1/2 right-2 left-2 h-1 -translate-y-1/2 rounded-full bg-black/[.08] dark:bg-white/[.145]" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground"
          style={{
            left: `calc(0.5rem + (100% - 1rem) * ${start / 100})`,
            right: `calc(0.5rem + (100% - 1rem) * ${(100 - end) / 100})`,
          }}
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={1}
          value={min}
          aria-label={`${label} start`}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange(next, Math.max(next, max));
          }}
          className="range-thumbs"
        />
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={1}
          value={max}
          aria-label={`${label} end`}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange(Math.min(min, next), next);
          }}
          className="range-thumbs"
        />
      </div>
      <div className="flex justify-between px-1 text-xs text-zinc-600 dark:text-zinc-400">
        {steps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <label className="text-sm">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-full border border-black/[.08] bg-transparent px-4 dark:border-white/[.145]"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function memoryChipClass(
  generation: MemoryGeneration,
  active: MemoryGeneration | "all",
): string {
  const highlighted = active === "all" || active === generation;
  if (!highlighted) return "bg-black/[.04] text-zinc-400 dark:bg-white/[.06] dark:text-zinc-500";
  return "bg-black/[.06] text-black dark:bg-white/[.08] dark:text-zinc-50";
}
