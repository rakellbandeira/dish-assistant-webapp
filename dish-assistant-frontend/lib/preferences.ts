export type DishEntry = { id: string; name: string; rating: number }; // rating 0 = unrated, 1-5

export type Preferences = {
  likedFlavors: string[];
  likedFoods: string[];
  dislikedFlavors: string[];
  dislikedFoods: string[];
  cuisines: string[];
  dietary: string[];
  allergies: string[];
  triedDishes: DishEntry[];
};

export const EMPTY_PREFERENCES: Preferences = {
  likedFlavors: [],
  likedFoods: [],
  dislikedFlavors: [],
  dislikedFoods: [],
  cuisines: [],
  dietary: [],
  allergies: [],
  triedDishes: [],
};

export const FLAVORS = ["Sweet", "Savory", "Spicy", "Sour", "Bitter", "Umami", "Smoky", "Tangy", "Creamy", "Herby"];
export const FOODS = ["Chicken", "Beef", "Pork", "Seafood", "Tofu", "Eggs", "Mushrooms", "Cheese", "Pasta", "Rice", "Beans", "Leafy greens", "Root vegetables", "Nuts"];
export const CUISINES = ["Italian", "Mexican", "Japanese", "Chinese", "Indian", "Thai", "Korean", "Vietnamese", "Mediterranean", "Middle Eastern", "French", "American"];
export const DIETARY = ["Vegetarian", "Vegan", "Pescatarian", "Gluten-free", "Dairy-free", "Halal", "Kosher", "Low-carb", "Keto", "Paleo"];

export const STEPS = [
  { id: "likes", title: "Likes", description: "What flavors and foods make you happy?" },
  { id: "dislikes", title: "Dislikes", description: "Anything you'd rather not see in a suggestion?" },
  { id: "cuisines", title: "Cuisines", description: "Which cuisines do you want to see more of?" },
  { id: "diet", title: "Diet & allergies", description: "We'll keep these out of every recommendation." },
  { id: "tried", title: "Dishes tried", description: "Rate dishes you've already had so we can learn your taste." },
  { id: "review", title: "Review", description: "Check everything over before saving." },
] as const;

export type StepId = (typeof STEPS)[number]["id"];
export type StepErrors = Record<string, string>;

export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id);

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function validateStep(id: StepId, p: Preferences): StepErrors {
  const errors: StepErrors = {};

  if (id === "likes" && !p.likedFlavors.length && !p.likedFoods.length) {
    errors.likes = "Pick at least one flavor or food you like.";
  }

  if (id === "dislikes") {
    const clash = [
      ...p.likedFlavors.filter((f) => p.dislikedFlavors.includes(f)),
      ...p.likedFoods.filter((f) => p.dislikedFoods.includes(f)),
    ];
    if (clash.length) {
      errors.dislikes = `${clash.join(", ")} ${clash.length > 1 ? "are" : "is"} in both your likes and dislikes. Remove ${clash.length > 1 ? "them" : "it"} from one list.`;
    }
  }

  if (id === "cuisines" && !p.cuisines.length) {
    errors.cuisines = "Choose at least one cuisine.";
  }

  if (id === "tried") {
    const seen = new Set<string>();
    for (const d of p.triedDishes) {
      const name = d.name.trim();
      if (!name && d.rating === 0) continue; 
      if (!name) errors[`dish:${d.id}`] = "Add a dish name.";
      else if (d.rating === 0) errors[`dish:${d.id}`] = "Give this dish a rating.";
      else if (seen.has(name.toLowerCase())) errors[`dish:${d.id}`] = "You've already added this dish.";
      if (name) seen.add(name.toLowerCase());
    }
  }

  return errors;
}

export function firstInvalidStep(p: Preferences): number {
  return STEPS.findIndex((s) => Object.keys(validateStep(s.id, p)).length > 0);
}

export function cleanPreferences(p: Preferences): Preferences {
  return {
    ...p,
    allergies: p.allergies.map((a) => a.trim()).filter(Boolean),
    triedDishes: p.triedDishes
      .filter((d) => d.name.trim() || d.rating > 0)
      .map((d) => ({ ...d, name: d.name.trim() })),
  };
}

const STORAGE_KEY = "dish-assistant:preferences";

export function loadPreferences(): Preferences | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_PREFERENCES, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export async function savePreferences(p: Preferences): Promise<void> {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  await new Promise((r) => setTimeout(r, 400)); 
}