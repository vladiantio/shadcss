export type ItemType = "component" | "primitive" | "foundation" | "theme";
export type ItemStatus = "stable" | "experimental";
export type FileRole = "base" | "theme";

export type LayerName =
  | "shadcss.tokens"
  | "shadcss.reset"
  | "shadcss.base"
  | "shadcss.components"
  | "shadcss.theme"
  | "shadcss.utilities";

export interface RegistryFile {
  path: string;
  target: string;
  role: FileRole;
  layer: LayerName;
}

export interface RegistryItem {
  name: string;
  type: ItemType;
  status: ItemStatus;
  title: string;
  description: string;
  docs?: string;
  root: string[];
  registryDependencies?: string[];
  optionalDependencies?: string[];
  files: RegistryFile[];
  examples?: string[];
}

export interface Registry {
  $schema?: string;
  name: string;
  version: string;
  items: RegistryItem[];
}

export interface ShadcssConfig {
  $schema?: string;
  cssDir: string;
  entrypoint?: string;
  theme: string;
}

export interface ManifestFile {
  path: string;
  hash: string;
}

export interface ManifestItem {
  name: string;
  version: string;
  files: ManifestFile[];
}

export interface Manifest {
  version: string;
  items: ManifestItem[];
}
