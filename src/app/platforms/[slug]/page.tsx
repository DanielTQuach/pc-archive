import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { platforms } from "@/data/platforms";
import { KIND_LABELS, SEGMENT_LABELS, type Product } from "@/data/types";
import {
  getPlatform,
  platformsInGroup,
  productMemory,
  productsForPlatform,
} from "@/lib/catalog";

export function generateStaticParams() {
  return platforms.map((platform) => ({ slug: platform.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/platforms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) return { title: "PC Archive" };
  return { title: `${platform.marketingName} · PC Archive` };
}

export default async function PlatformPage({
  params,
}: PageProps<"/platforms/[slug]">) {
  const { slug } = await params;
  const platform = getPlatform(slug);
  if (!platform) notFound();

  const siblings = platformsInGroup(platform.socketGroup).filter(
    (item) => item.id !== platform.id,
  );
  const products = productsForPlatform(platform.id);
  const kinds = [...new Set(products.map((product) => product.kind))];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 bg-white px-6 py-16 dark:bg-black">
      <Link href="/" className="text-sm font-medium text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400">
        Back to the catalog
      </Link>
      <header className="flex flex-col gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {platform.vendor === "intel" ? "Intel" : "AMD"} · {platform.year} ·{" "}
          {SEGMENT_LABELS[platform.segment]}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {platform.marketingName}
        </h1>
        <p className="text-lg">{platform.codename}</p>
      </header>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Socket</dt>
          <dd>{platform.socket}</dd>
        </div>
        <div>
          <dt className="font-medium">Chipsets</dt>
          <dd>{platform.chipsets.join(", ")}</dd>
        </div>
        <div>
          <dt className="font-medium">Example CPUs</dt>
          <dd>{platform.cpus.join(", ")}</dd>
        </div>
        <div>
          <dt className="font-medium">PCIe</dt>
          <dd>
            {platform.io.cpuPcie}
            {platform.io.chipsetPcie ? `. Chipset ${platform.io.chipsetPcie}` : ""}
          </dd>
        </div>
        <div>
          <dt className="font-medium">USB</dt>
          <dd>{platform.io.usbMax}</dd>
        </div>
        <div>
          <dt className="font-medium">Thunderbolt</dt>
          <dd>
            {platform.io.thunderbolt === "none"
              ? "None"
              : `${platform.io.thunderbolt === "integrated" ? "Integrated" : "Add-in"} Thunderbolt ${platform.io.thunderboltVersion}`}
          </dd>
        </div>
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Memory</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {platform.memory.map((item) => (
            <li key={item.generation}>
              <span className="font-medium">{item.generation}.</span> {item.details}
            </li>
          ))}
        </ul>
      </section>

      {platform.note ? <p className="text-sm leading-6">{platform.note}</p> : null}

      {siblings.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Same socket</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {siblings.map((sibling) => (
              <li key={sibling.id}>
                <Link
                  href={`/platforms/${sibling.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {sibling.marketingName}
                </Link>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {" "}
                  · {sibling.year} ·{" "}
                  {sibling.memory.map((item) => item.generation).join(" + ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Products</h2>
        {products.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No example products in the starter slice.
          </p>
        ) : (
          kinds.map((kind) => (
            <div key={kind} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{KIND_LABELS[kind]}</h3>
              <ul className="flex flex-col gap-3">
                {products
                  .filter((product) => product.kind === kind)
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      memory={productMemory(product, platform)}
                    />
                  ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
    </div>
  );
}

function ProductCard({
  product,
  memory,
}: {
  product: Product;
  memory: string[];
}) {
  const oculink =
    product.kind === "mini-pc" || product.kind === "sbc"
      ? product.ports?.oculink
      : undefined;
  return (
    <li className="rounded-lg border border-black/[.08] p-4 text-sm dark:border-white/[.145]">
      <p className="font-medium">
        {product.brand} {product.name}
      </p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        {product.year} · {memory.join(" + ")}
      </p>
      {product.note ? <p className="mt-2">{product.note}</p> : null}
      <ul className="mt-2 flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
        {product.ports?.usbC?.map((port) => (
          <li key={port}>USB-C: {port}</li>
        ))}
        {product.ports?.thunderbolt ? <li>{product.ports.thunderbolt}</li> : null}
        {product.ports?.pcie ? <li>{product.ports.pcie}</li> : null}
        {oculink ? <li>{oculink}</li> : null}
      </ul>
    </li>
  );
}
