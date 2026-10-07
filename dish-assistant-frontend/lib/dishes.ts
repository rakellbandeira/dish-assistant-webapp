// Dishes the user liked (GET /api/dishes/liked): dishes rated 4-5 in preferences,
// plus recommended dishes that got positive feedback.
import { apiRequest } from "@/lib/api";

export type LikedDish = {
  name: string;
  source: "rating" | "feedback";
  rating: number | null; // only for "rating"
  description: string | null; // only for "feedback"
  section: string | null; // only for "feedback"
};

export async function getLikedDishes(): Promise<LikedDish[]> {
  const { dishes } = await apiRequest<{ dishes: LikedDish[] }>("/api/dishes/liked");
  return dishes;
}
