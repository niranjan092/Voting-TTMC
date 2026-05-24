"use client";

import React, { useState, useEffect } from "react";
import type { SubmitEventHandler } from "react";
import {
  ShieldCheck,
  Settings2,
  Power,
  Trash2,
  Plus,
  BarChart3,
  Users,
  Lock,
  Loader2,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

// --- MOCK DATA & TYPES ---
type Candidate = { id: string; name: string; votes: number };
type Category = { id: string; name: string };
type SettingRow = { is_voting_open?: boolean; active_session_id?: string };

const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Best Table Topics Speaker" },
  { id: "cat-2", name: "Best Evaluator" },
  { id: "cat-3", name: "Best Prepared Speaker" },
];

const INITIAL_CANDIDATES: Candidate[] = [
  { id: "cand-1", name: "Sarah Jenkins", votes: 12 },
  { id: "cand-2", name: "John Doe", votes: 8 },
  { id: "cand-3", name: "Arjun Mehta", votes: 5 },
];

export default function AdminDashboard() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // --- DASHBOARD STATE ---
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(MOCK_CATEGORIES[0].id);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [newCandidateName, setNewCandidateName] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!isSupabaseConfigured) {
        setDataLoading(false);
        return;
      }

      try {
        const { data: categoryRows, error: categoryError } = await supabase
          .from("categories")
          .select("id,name");

        if (categoryError) {
          console.warn("Failed to load categories", categoryError);
        }

        const { data: candidatesRows, error: candidatesError } = await supabase
          .from("candidates")
          .select("id,name,votes,category_id");

        if (candidatesError) {
          console.warn("Failed to load candidates", candidatesError);
        }

        const { data: openSetting, error: openError } = await supabase
          .from("system_settings")
          .select("is_voting_open,active_session_id")
          .limit(1)
          .single();

        if (openError) {
          console.warn("Failed to load voting status", openError);
        }

        const activeCategories = categoryRows && categoryRows.length > 0 ? categoryRows : MOCK_CATEGORIES;
        const candidateData = candidatesRows && candidatesRows.length > 0 ? candidatesRows : INITIAL_CANDIDATES;

        setCategories(activeCategories);
        setActiveCategoryId(activeCategories[0]?.id ?? activeCategoryId);
        setCandidates(candidateData.filter((candidate) => {
          return (candidate as any).category_id ? (candidate as any).category_id === activeCategories[0]?.id : true;
        }));
        setIsVotingOpen(openSetting?.is_voting_open ?? false);
      } catch (error) {
        console.error("Error loading admin data:", error);
        setServerError("Unable to load data from Supabase. Using local fallback data.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleLogin: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setAuthError(false);
      } else {
        setAuthError(true);
        setPasswordInput("");
      }
    } catch (error) {
      console.error("Admin login failed:", error);
      setAuthError(true);
      setPasswordInput("");
    }
  };

  const toggleVoting = async () => {
    const nextValue = !isVotingOpen;
    setIsVotingOpen(nextValue);

    if (!isSupabaseConfigured) return;

    const { error } = await supabase.from("system_settings").upsert(
      { id: 1, is_voting_open: nextValue },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Unable to update voting status:", error);
    }
  };

  const addCandidate: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;

    const newCand: Candidate = {
      id: `cand-${Date.now()}`,
      name: newCandidateName,
      votes: 0,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("candidates")
        .insert({ name: newCandidateName, category_id: activeCategoryId, votes: 0 })
        .select("id")
        .single();

      if (error) {
        console.error("Unable to create candidate:", error);
      } else if (data?.id) {
        newCand.id = data.id;
      }
    }

    setCandidates((prev) => [...prev, newCand]);
    setNewCandidateName("");
  };

  const deleteCandidate = async (id: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) {
        console.error("Unable to delete candidate:", error);
      }
    }

    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const filteredCandidates = candidates.filter((candidate) => {
    return (candidate as any).category_id
      ? (candidate as any).category_id === activeCategoryId
      : true;
  });

  const maxVotes = Math.max(...filteredCandidates.map((c) => c.votes), 1);
  const totalVotes = filteredCandidates.reduce((sum, c) => sum + c.votes, 0);
  const sortedCandidates = [...filteredCandidates].sort((a, b) => b.votes - a.votes);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-slate-100">
          <div className="w-16 h-16 bg-[#004165]/10 text-[#004165] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-center text-[#004165] mb-2">Chief Judge Access</h1>
          <p className="text-sm text-slate-500 text-center mb-6">Enter the administrative password to manage live voting.</p>

          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter password..."
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#004165] mb-4 transition-colors"
          />
          {authError && <p className="text-xs text-red-500 mb-4 text-center">Incorrect password. Please try again.</p>}
          
          <button type="submit" className="w-full bg-[#772432] hover:bg-[#5f1c27] text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Unlock Dashboard</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <header className="bg-[#004165] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings2 className="w-6 h-6 text-slate-300" />
            <h1 className="font-bold text-xl tracking-wide">Techspire Admin Console</h1>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="bg-[#00304a] px-3 py-1 rounded-full border border-[#004165]">Logged in as Chief Judge</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#004165] mb-4 flex items-center">
              <Power className="w-5 h-5 mr-2" /> Live Controls
            </h2>

            <div className="mb-6">
              <label htmlFor="category-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Category</label>
              <select
                id="category-select"
                value={activeCategoryId}
                onChange={(e) => setActiveCategoryId(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#004165] bg-slate-50"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Voting Status</p>
                <p className="text-xs text-slate-500">{isVotingOpen ? "Members can currently vote." : "Voting is locked."}</p>
              </div>
              <button
                onClick={toggleVoting}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${isVotingOpen ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isVotingOpen ? "translate-x-8" : "translate-x-1"}`} />
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-[#004165] mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" /> Manage Candidates
            </h2>

            <form onSubmit={addCandidate} className="flex space-x-2 mb-6">
              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder="New candidate name..."
                className="flex-1 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004165] text-sm"
              />
              <button type="submit" className="bg-[#004165] hover:bg-[#00304a] text-white p-2 rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {serverError && <p className="text-sm text-red-500 mb-4">{serverError}</p>}
            {dataLoading && (
              <div className="text-sm text-slate-500 mb-4">Loading Supabase data...</div>
            )}

            <ul className="space-y-3">
              {filteredCandidates.map((candidate) => (
                <li key={candidate.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-medium text-sm text-slate-700">{candidate.name}</span>
                  <button
                    onClick={() => deleteCandidate(candidate.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Delete Candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {filteredCandidates.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No candidates added.</p>
              )}
            </ul>
          </section>
        </div>

        <div className="lg:col-span-2">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#004165] flex items-center">
                <BarChart3 className="w-6 h-6 mr-2" /> Live Tally
              </h2>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                {totalVotes} Total Votes
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {sortedCandidates.map((candidate) => {
                const percentage = maxVotes === 0 ? 0 : (candidate.votes / maxVotes) * 100;

                return (
                  <div key={candidate.id} className="relative">
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-bold text-slate-800">{candidate.name}</span>
                      <span className="text-sm font-bold text-[#772432]">{candidate.votes} votes</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#004165] rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {filteredCandidates.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-48">
                  <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                  <p>Awaiting candidates to display chart.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
