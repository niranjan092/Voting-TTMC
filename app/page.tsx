"use client";

import React, { useState, useEffect } from "react";
import type { SubmitEvent } from "react";
import { Vote, Lock, CheckCircle2, Award, User, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

type Candidate = { id: string; name: string };
type Category = { id: string; name: string };
type SessionData = {
  active_session_id: string;
  is_voting_open: boolean;
  category: Category;
  candidates: Candidate[];
};

type SettingRow = { is_voting_open?: boolean; active_session_id?: string };

const DEFAULT_SESSION: SessionData = {
  active_session_id: "meeting-2026-05-24",
  is_voting_open: true,
  category: {
    id: "cat-1",
    name: "Best Table Topics Speaker",
  },
  candidates: [
    { id: "cand-1", name: "Distinguished Toastmaster Sarah Jenkins" },
    { id: "cand-2", name: "John Doe" },
    { id: "cand-3", name: "Arjun Mehta" },
    { id: "cand-4", name: "Elena Rostova" },
  ],
};

export default function VotingPage() {
  const [votingState, setVotingState] = useState<"loading" | "closed" | "open" | "voted">("loading");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<SessionData>(DEFAULT_SESSION);

  useEffect(() => {
    const loadSession = async () => {
      let currentSession: SessionData = DEFAULT_SESSION;

      if (isSupabaseConfigured) {
        try {
          const { data: activeCategory, error: categoryError } = await supabase
            .from("categories")
            .select("id,name")
            .eq("is_active", true)
            .limit(1)
            .single();

          if (categoryError) {
            console.warn("Supabase category load failed", categoryError);
          }

          const { data: candidateRows, error: candidateError } = await supabase
            .from("candidates")
            .select("id,name")
            .eq("category_id", activeCategory?.id ?? DEFAULT_SESSION.category.id);

          if (candidateError) {
            console.warn("Supabase candidate load failed", candidateError);
          }

          const { data: settingRow, error: settingError } = await supabase
            .from("system_settings")
            .select("is_voting_open,active_session_id")
            .limit(1)
            .single();

          if (settingError) {
            console.warn("Supabase voting status load failed", settingError);
          }

          currentSession = {
            active_session_id: settingRow?.active_session_id ?? DEFAULT_SESSION.active_session_id,
            is_voting_open: settingRow?.is_voting_open ?? DEFAULT_SESSION.is_voting_open,
            category: activeCategory ?? DEFAULT_SESSION.category,
            candidates: candidateRows && candidateRows.length > 0 ? candidateRows : DEFAULT_SESSION.candidates,
          };
        } catch (error) {
          console.error("Error loading session from Supabase:", error);
        }
      }

      setSession(currentSession);
    };

    loadSession();
  }, []);

  useEffect(() => {
    const storedVote = localStorage.getItem(`voted_${session.active_session_id}`);

    if (storedVote) {
      setVotingState("voted");
    } else if (session.is_voting_open) {
      setVotingState("open");
    } else {
      setVotingState("closed");
    }
  }, [session]);

  const handleVoteSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured) {
        const deviceIdentifier = typeof window !== "undefined" ? window.navigator.userAgent : session.active_session_id;
        const { error } = await supabase.from("votes").insert([
          {
            session_id: session.active_session_id,
            category_id: session.category.id,
            candidate_id: selectedCandidate,
            device_identifier: deviceIdentifier,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.warn("Supabase vote insert failed", error);
        }
      }

      localStorage.setItem(`voted_${session.active_session_id}`, "true");
      setVotingState("voted");
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (votingState === "loading") {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#004165]" />
      </div>
    );
  }

  const isSubmitDisabled = !selectedCandidate || isSubmitting;

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-slate-800 flex flex-col font-sans">
      <header className="bg-[#004165] text-white shadow-md border-b-4 border-[#772432]">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-[#A9B2B1]" />
            <div>
              <h1 className="font-bold text-lg tracking-wide uppercase">Techspire</h1>
              <p className="text-xs text-[#A9B2B1] font-medium tracking-wider">Toastmasters Club • Club 7821633</p>
            </div>
          </div>
          <div className="bg-[#772432] px-3 py-1 rounded text-xs font-semibold tracking-wider uppercase shadow-inner">
            Live Ballot
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {votingState === "closed" && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 transform transition-all animate-fade-in">
            <div className="w-16 h-16 bg-amber-50 text-[#772432] rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#004165] mb-3">Voting is Closed</h2>
            <p className="text-slate-600 leading-relaxed">
              Please wait for the <span className="font-semibold text-slate-900">Toastmaster of the Day</span> or <span className="font-semibold text-slate-900">Timer</span> to open the voting session.
            </p>
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-400">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></span>
              <span>Waiting for live signal...</span>
            </div>
          </div>
        )}

        {votingState === "open" && (
          <form onSubmit={handleVoteSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-widest text-[#772432] block mb-1">
                Current Category
              </span>
              <h2 className="text-2xl font-extrabold text-[#004165] tracking-tight">
                {session.category.name}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Select one candidate who delivered the best performance.
              </p>
            </div>

            <div className="space-y-3">
              {session.candidates.map((candidate) => {
                const isSelected = selectedCandidate === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidate(candidate.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group active:scale-[0.99] ${
                      isSelected
                        ? "border-[#004165] bg-[#004165]/5 shadow-md ring-2 ring-[#004165]/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#004165] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <span className={`font-semibold text-base transition-colors ${
                        isSelected ? "text-[#004165]" : "text-slate-800"
                      }`}>
                        {candidate.name}
                      </span>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? "border-[#004165] bg-[#004165]" : "border-slate-300 bg-white"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-4 rounded-xl font-bold tracking-wide shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                isSubmitDisabled
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-[#772432] hover:bg-[#5f1c27] text-white active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  <span>Submit Vote</span>
                </>
              )}
            </button>
          </form>
        )}

        {votingState === "voted" && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 transform transition-all animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-[#004165] mb-2">Thank You!</h2>
            <p className="text-slate-600 font-medium">Your vote has been successfully recorded.</p>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              To keep elections fair, this device is locked for the remainder of the active category voting window.
            </p>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Where Leaders Are Made
      </footer>
    </div>
  );
}
