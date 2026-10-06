// Rating recommended dishes (POST /api/feedback).
// 3-5 stars = liked, 1-2 stars = disliked; the dish is also added to the user's
// preferences ("Dishes tried"), so future recommendations take it into account.
import { apiRequest } from "@/lib/api";

export const LIKED_MIN_RATING = 3;

// Fired after a rating is saved, so other parts of the page (e.g. the liked dishes row) can refresh
export const DISH_RATED_EVENT = "dish-rated";

export type RatingResult = { dishId: string; rating: number; liked: boolean };

export async function rateDish(dishId: string, rating: number): Promise<RatingResult> {
  const result = await apiRequest<RatingResult>("/api/feedback", {
    method: "POST",
    body: JSON.stringify({ dishId, rating }),
  });
  window.dispatchEvent(new Event(DISH_RATED_EVENT));
  return result;
}
