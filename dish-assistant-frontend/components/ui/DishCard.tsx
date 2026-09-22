import { Heart, MessageCircle, Bookmark } from "lucide-react";

type DishCardProps = {
  name: string;
  meta: string;
};

export default function DishCard({ name, meta }: DishCardProps) {
  return (
    <div className="rounded-xl border border-secondary/15 bg-white p-4 text-left">
      <div className="mb-3 h-20 rounded-lg bg-secondary/80" />
      <p className="font-heading text-sm text-error">{name}</p>
      <p className="mt-1 text-xs text-secondary">{meta}</p>
      <div className="mt-3 flex gap-4 text-secondary">
        <button type="button" aria-label="Like" className="hover:text-primary">
          <Heart size={16} />
        </button>
        <button type="button" aria-label="Comment" className="hover:text-primary">
          <MessageCircle size={16} />
        </button>
        <button type="button" aria-label="Save" className="hover:text-primary">
          <Bookmark size={16} />
        </button>
      </div>
    </div>
  );
}
