import { Catalog } from "@/components/catalog";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 bg-white px-6 py-16 dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          PC Archive
        </h1>
        <Catalog />
      </main>
    </div>
  );
}
