// Types and API call for AI dish recommendations (POST /api/recommendations).
// Example payloads: see the JSON examples shared with the team.
import { apiRequest } from "@/lib/api";

export const MENU_MIN_LENGTH = 10;
export const MENU_MAX_LENGTH = 5000;

export type RecommendationRequest = {
  menuText: string;
  restaurantName?: string;
  restaurantPlace: string; // required: city and country
};

export type RecommendedDish = {
  id: string;
  name: string;
  description: string; // what the dish is
  classification: "familiar" | "new";
  reason: string; // why it was picked for this user
  section: string; // Appetizer, Soup, Salad, Main, Side, Dessert, Drink or Other
};

export type Recommendation = {
  id: string;
  menuId: string;
  summary: string;
  familiarDishes: RecommendedDish[];
  newDishes: RecommendedDish[];
  createdAt: string;
};

export function getRecommendation(request: RecommendationRequest): Promise<Recommendation> {
  return apiRequest<Recommendation>("/api/recommendations", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
