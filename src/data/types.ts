export type Vendor = "intel" | "amd";

export type Segment =
  | "desktop"
  | "mobile"
  | "embedded"
  | "hedt"
  | "workstation"
  | "server";

/** The three DIMM generations people shop for. LPDDR of the same generation counts here. */
export type MemoryGeneration = "DDR3" | "DDR4" | "DDR5";

export type MemorySupport = {
  generation: MemoryGeneration;
  /** How this platform actually uses that generation: DIMM, SODIMM, RDIMM, or soldered. */
  details: string;
};

export type ThunderboltMode = "none" | "add-in" | "integrated";

export type PlatformIo = {
  cpuPcie: string;
  /** Highest PCIe generation the CPU exposes. Used by the PCIe filter. */
  pcieGen: 2 | 3 | 4 | 5 | 6;
  chipsetPcie?: string;
  usbMax: string;
  thunderbolt: ThunderboltMode;
  thunderboltVersion?: 3 | 4 | 5;
};

export type Platform = {
  id: string;
  vendor: Vendor;
  segment: Segment;
  codename: string;
  marketingName: string;
  year: number;
  socket: string;
  /** Platforms that can share a board. */
  socketGroup: string;
  socketGroupLabel: string;
  memory: MemorySupport[];
  chipsets: string[];
  cpus: string[];
  io: PlatformIo;
  note?: string;
};

export type ProductKind =
  | "motherboard"
  | "laptop"
  | "mini-pc"
  | "sbc"
  | "oem-desktop"
  | "workstation"
  | "server";

export type ProductPorts = {
  usbC?: string[];
  thunderbolt?: string;
  pcie?: string;
};

/** OCuLink is only recorded on Mini PCs and SBCs. */
export type OculinkPorts = ProductPorts & {
  oculink?: string;
};

type ProductBase = {
  id: string;
  name: string;
  brand: string;
  year: number;
  platformIds: string[];
  /**
   * DIMM generations this model accepts.
   * Omit it when the product can use every memory type on its platform.
   */
  memory?: MemoryGeneration[];
  note?: string;
};

export type Product =
  | (ProductBase & {
      kind: "mini-pc" | "sbc";
      ports?: OculinkPorts;
    })
  | (ProductBase & {
      kind: Exclude<ProductKind, "mini-pc" | "sbc">;
      ports?: ProductPorts;
    });

export const MEMORY_GENERATIONS: MemoryGeneration[] = ["DDR3", "DDR4", "DDR5"];

export const SEGMENT_LABELS: Record<Segment, string> = {
  desktop: "Desktop",
  mobile: "Laptop",
  embedded: "Embedded",
  hedt: "HEDT",
  workstation: "Workstation",
  server: "Server",
};

export const KIND_LABELS: Record<ProductKind, string> = {
  motherboard: "Motherboard",
  laptop: "Laptop",
  "mini-pc": "Mini PC",
  sbc: "SBC",
  "oem-desktop": "OEM desktop",
  workstation: "Workstation",
  server: "Server",
};
