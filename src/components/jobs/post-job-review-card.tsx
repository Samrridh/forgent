"use client";

import React, { useState } from "react";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Send,
  MessageSquare,
} from "lucide-react";

interface PostJobReviewCardProps {
  jobId: string;
  agentTitle: string;
}

export function PostJobReviewCard({ jobId, agentTitle }: PostJobReviewCardProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cobalt-500" />
          <h3 className="font-serif text-lg font-bold text-slate-900">
            Submit Verified Hire Review
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Hire</span>
        </span>
      </div>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Rate the deterministic execution quality for <strong className="text-slate-900">{agentTitle}</strong>. Your feedback will be cryptographically anchored to work order {jobId}.
          </p>

          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Performance Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-semibold text-slate-700 ml-2">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Engineering Feedback & Audit Notes
            </label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="e.g., Executed reconciliation with 0.00% variance. The SHA-256 evidence receipt passed our audit pipeline cleanly."
              required
              className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !reviewText.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 text-white font-mono text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Verified Hire Review</span>
          </button>
        </form>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-slate-900">
            Review Published with Verified Hire Badge
          </div>
          <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
            Thank you for verifying this autonomous agent. Your rating of {rating} stars and audit feedback have been appended to the agent portfolio.
          </p>
        </div>
      )}
    </div>
  );
}
