import {
  Armchair,
  Building2,
  Car,
  Gem,
  Hammer,
  HardHat,
  Home,
  Laptop,
  type LucideIcon,
  Repeat,
  Shirt,
  Sun,
  Tag,
  Wheat,
  Wrench,
} from "lucide-react";

/**
 * One icon library everywhere (docs/UI_UX_SPEC.md section 66). Categories come
 * from the database; this maps their slugs to icons, with a neutral fallback
 * for any category added later.
 */
const ICONS: Record<string, LucideIcon> = {
  electronics: Laptop,
  solar: Sun,
  vehicles: Car,
  property: Building2,
  housing: Home,
  services: Wrench,
  agriculture: Wheat,
  fashion: Shirt,
  home: Armchair,
  construction: HardHat,
  community: Repeat,
  collectibles: Gem,
  machinery: Hammer,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Tag;
  return <Icon className={className} aria-hidden="true" />;
}
