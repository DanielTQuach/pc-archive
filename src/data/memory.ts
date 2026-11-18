import type { MemoryGeneration, MemorySupport } from "./types";

export function mem(
  generation: MemoryGeneration,
  details: string,
): MemorySupport {
  return { generation, details };
}
