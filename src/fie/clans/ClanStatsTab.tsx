"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { Clan } from "./ClanAdminForm";

interface ClanStatsTabProps {
  clans: Clan[];
  loading: boolean;
  notify: (type: "success" | "danger" | "warning", text: string) => void;
  loadAdminData: () => void;
}

export default function ClanStatsTab({ clans, loading, notify, loadAdminData }: ClanStatsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClans, setFilteredClans] = useState<Clan[]>([]);
  const [selectedClanId, setSelectedClanId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [clanFormData, setClanFormData] = useState({
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
  });

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredClans(clans);
    } else {
      setFilteredClans(clans.filter((c) => c.clan_name.toLowerCase().includes(term)));
    }
  }, [searchTerm, clans]);

  const handleSelectClan = (clan: Clan) => {
    setSelectedClanId(clan.id);
    setClanFormData({
      w: clan.w,
      d: clan.d,
      l: clan.l,
      gf: clan.gf,
      ga: clan.ga,
    });
  };

  const handleClanNumberChange = (field: keyof typeof clanFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClanFormData((prev) => ({
      ...prev,
      [field]: val === "" ? 0 : Math.max(0, parseInt(val, 10)),
    }));
  };

  const handleClanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClanId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("clans")
        .update(clanFormData)
        .eq("id", selectedClanId);

      if (error) throw error;
      notify("success", "Clan match statistics updated successfully!");
      loadAdminData();
    } catch (err: any) {
      notify("danger", "Could not apply statistics amendments.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentGoalDifference = clanFormData.gf - clanFormData.ga;

  return (
    <div className="row g-4 h-100">
      <div className="col-lg-5 col-xl-4">
        <div className="card border-0 shadow-sm rounded-4 d-flex flex-column" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <div className="p-3 border-bottom bg-white rounded-top-4">
            <h5 className="fw-bold text-dark mb-3">Select Clan</h5>
            <input
              type="text"
              className="form-control"
              style={{ borderRadius: "8px" }}
              placeholder="Search clan arrays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-auto bg-white rounded-bottom-4 flex-grow-1" style={{ overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-success" /></div>
            ) : filteredClans.length === 0 ? (
              <div className="text-center py-4 text-muted small">No clans cataloged.</div>
            ) : (
              <div className="list-group list-group-flush">
                {filteredClans.map((clan) => (
                  <button
                    key={clan.id}
                    onClick={() => handleSelectClan(clan)}
                    className={`list-group-item list-group-item-action py-3 border-0 px-4 text-start ${selectedClanId === clan.id ? "bg-success-subtle text-success fw-bold" : ""}`}
                  >
                    <i className="bi bi-shield-shaded me-2"></i> {clan.clan_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-lg-7 col-xl-8">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-header bg-white py-4 border-0 rounded-top-4">
            <h4 className="fw-bold mb-0 text-dark">
              {selectedClanId ? `Modify Clan Stats: ${clans.find(c => c.id === selectedClanId)?.clan_name}` : "Select a Clan to Alter Records"}
            </h4>
          </div>
          <div className="card-body p-4 p-lg-5 overflow-auto bg-white rounded-bottom-4">
            {selectedClanId ? (
              <form onSubmit={handleClanSubmit}>
                <div className="row g-4">
                  {[
                    { label: "Wins (W)", key: "w", color: "success" },
                    { label: "Draws (D)", key: "d", color: "warning" },
                    { label: "Losses (L)", key: "l", color: "danger" },
                    { label: "Goals For (GF)", key: "gf", color: "dark" },
                    { label: "Goals Against (GA)", key: "ga", color: "dark" },
                  ].map(({ label, key, color }) => (
                    <div className="col-6 col-sm-4" key={key}>
                      <div className="p-3 bg-light rounded border text-center">
                        <label className={`d-block small fw-bold text-${color} mb-1`}>{label}</label>
                        <input
                          type="number"
                          className="form-control text-center fw-bold fs-4 border-0 bg-transparent"
                          value={clanFormData[key as keyof typeof clanFormData]}
                          onChange={handleClanNumberChange(key as keyof typeof clanFormData)}
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="col-6 col-sm-4">
                    <div className={`p-3 rounded border text-center ${currentGoalDifference >= 0 ? "bg-success-subtle border-success text-success" : "bg-danger-subtle border-danger text-danger"}`}>
                      <label className="d-block small fw-bold mb-1">Goal Diff (GD)</label>
                      <div className="fw-bold fs-3">{currentGoalDifference >= 0 ? "+" : ""}{currentGoalDifference}</div>
                    </div>
                  </div>
                  <div className="col-12 mt-5">
                    <button type="submit" disabled={submitting} className="btn btn-success btn-lg px-5 fw-bold shadow-sm">
                      {submitting ? "Updating Stats..." : "Save Clan Changes"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center py-5 text-muted">Select a clan from the listing pane to patch database configurations.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}