import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function VoteButtons() {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setUpvotes(upvotes + 1)}
        className="flex items-center gap-1 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-xl"
      >
        <ThumbsUp size={18} /> {upvotes}
      </button>

      <button
        onClick={() => setDownvotes(downvotes + 1)}
        className="flex items-center gap-1 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-xl"
      >
        <ThumbsDown size={18} /> {downvotes}
      </button>
    </div>
  );
}
