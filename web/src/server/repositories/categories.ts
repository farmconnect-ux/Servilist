import "server-only";
import type { Db } from "@/lib/db/server";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  subcategories?: CategoryItem[];
}

export async function listCategories(db: Db): Promise<CategoryItem[]> {
  const { data, error } = await db
    .from("categories")
    .select("id, name, slug, description, icon, image_url, parent_id, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    // If table not created yet in dev fallback, return standard African categories
    return [
      { id: "cat-1", name: "Electronics", slug: "electronics", description: "Phones, laptops & audio", icon: "📱", imageUrl: null, parentId: null, sortOrder: 1 },
      { id: "cat-2", name: "Solar & Power", slug: "solar", description: "Inverters & batteries", icon: "☀️", imageUrl: null, parentId: null, sortOrder: 2 },
      { id: "cat-3", name: "Vehicles", slug: "vehicles", description: "Cars & bikes", icon: "🚗", imageUrl: null, parentId: null, sortOrder: 3 },
      { id: "cat-4", name: "Property & Housing", slug: "property", description: "Apartments & land", icon: "🏠", imageUrl: null, parentId: null, sortOrder: 4 },
      { id: "cat-5", name: "Local Services", slug: "services", description: "Handymen & trades", icon: "🛠️", imageUrl: null, parentId: null, sortOrder: 5 },
      { id: "cat-6", name: "Agriculture", slug: "agriculture", description: "Produce & livestock", icon: "🌾", imageUrl: null, parentId: null, sortOrder: 6 },
    ];
  }

  const all = (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    imageUrl: row.image_url,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
  }));

  // Build tree
  const rootMap = new Map<string, CategoryItem>();
  const children: CategoryItem[] = [];

  for (const c of all) {
    if (!c.parentId) {
      rootMap.set(c.id, { ...c, subcategories: [] });
    } else {
      children.push(c);
    }
  }

  for (const child of children) {
    if (child.parentId && rootMap.has(child.parentId)) {
      rootMap.get(child.parentId)!.subcategories?.push(child);
    }
  }

  return Array.from(rootMap.values());
}

export async function getCategoryBySlug(db: Db, slug: string): Promise<CategoryItem | null> {
  const { data, error } = await db
    .from("categories")
    .select("id, name, slug, description, icon, image_url, parent_id, sort_order")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const { data: subcats } = await db
    .from("categories")
    .select("id, name, slug, description, icon, image_url, parent_id, sort_order")
    .eq("parent_id", data.id)
    .order("sort_order", { ascending: true });

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    icon: data.icon,
    imageUrl: data.image_url,
    parentId: data.parent_id,
    sortOrder: data.sort_order,
    subcategories: (subcats || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      icon: s.icon,
      imageUrl: s.image_url,
      parentId: s.parent_id,
      sortOrder: s.sort_order,
    })),
  };
}
