// components/ProfileEditForm.tsx
"use client";
import { useState, useRef, useEffect } from "react";

// Kenyan counties list
const KENYAN_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta",
  "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru",
  "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua",
  "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
  "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi",
  "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho",
  "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya",
  "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];

// Searchable Select Component (disabled version)
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  label: string;
  disabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-3" ref={wrapperRef}>
      <label className="form-label small fw-bold text-uppercase text-muted">
        {label}
        {disabled && value && (
          <span className="ms-2 badge bg-secondary" style={{ fontSize: "0.7rem" }}>
            <i className="bi bi-lock-fill me-1"></i> Locked
          </span>
        )}
      </label>
      <div className="dropdown w-100" style={{ position: "relative" }}>
        <div
          className={`form-control shadow-sm d-flex justify-content-between align-items-center ${disabled ? 'bg-light text-muted' : ''}`}
          style={{ 
            cursor: disabled ? "not-allowed" : "pointer", 
            backgroundColor: disabled ? "#e9ecef" : "#fff",
            opacity: disabled ? 0.7 : 1
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={value ? "" : "text-muted"}>
            {value || placeholder}
          </span>
          {!disabled && <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`}></i>}
          {disabled && <i className="bi bi-lock-fill text-muted"></i>}
        </div>
        {isOpen && !disabled && (
          <div
            className="dropdown-menu show w-100"
            style={{
              maxHeight: "250px",
              overflowY: "auto",
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 1000
            }}
          >
            <div className="px-2 pt-2 pb-1">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search county..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="dropdown-divider m-0"></div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  className={`dropdown-item ${value === opt ? "active bg-primary text-white" : ""}`}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="dropdown-item text-muted">No results found</div>
            )}
          </div>
        )}
      </div>
      {disabled && value && (
        <small className="text-muted d-block mt-1">
          <i className="bi bi-info-circle me-1"></i>
          County cannot be changed after confirmation
        </small>
      )}
    </div>
  );
}

interface ProfileEditFormProps {
  displayName: string;
  username: string;
  profilePic: string | null;
  gender: string;
  county: string;
  saving: boolean;
  isGenderLocked?: boolean;
  isCountyLocked?: boolean;
  onDisplayNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onGenderChange: (value: string) => void;
  onCountyChange: (value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export default function ProfileEditForm({
  displayName,
  username,
  profilePic,
  gender,
  county,
  saving,
  isGenderLocked = false,
  isCountyLocked = false,
  onDisplayNameChange,
  onUsernameChange,
  onGenderChange,
  onCountyChange,
  onFileChange,
  onSave
}: ProfileEditFormProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    await onFileChange(e);
    setUploading(false);
  };

  const hasGender = !!gender;
  const hasCounty = !!county;
  
  // Fields are locked if they already have a value AND the lock prop is true
  const genderDisabled = isGenderLocked && hasGender;
  const countyDisabled = isCountyLocked && hasCounty;

  return (
    <div>
      <h5 className="fw-bold text-primary mb-4">Edit Profile</h5>
      
      {/* Info Alert */}
      {(genderDisabled || countyDisabled) && (
        <div className="alert alert-info py-2 mb-4" style={{ fontSize: "0.85rem", borderRadius: "10px" }}>
          <i className="bi bi-shield-lock-fill me-2"></i>
          <strong>Note:</strong> Gender and County cannot be changed once saved for security and verification purposes.
        </div>
      )}
      
      {/* Avatar Upload */}
      <div className="mb-4 text-center p-3 bg-light rounded border">
        <p className="small fw-bold text-uppercase text-muted mb-2">Update Avatar</p>
        <input 
          type="file" 
          accept="image/*" 
          className="form-control form-control-sm" 
          onChange={handleFileChange} 
        />
        {(saving || uploading) && (
          <div className="mt-2">
            <span className="spinner-border spinner-border-sm text-primary me-2"></span>
            <span className="small text-primary">{uploading ? "Uploading..." : "Saving..."}</span>
          </div>
        )}
      </div>

      {/* Display Name */}
      <div className="mb-3">
        <label className="form-label small fw-bold text-uppercase text-muted">Display Name</label>
        <input 
          className="form-control shadow-sm" 
          value={displayName} 
          onChange={(e) => onDisplayNameChange(e.target.value)} 
        />
      </div>

      {/* Username */}
      <div className="mb-3">
        <label className="form-label small fw-bold text-uppercase text-muted">Username</label>
        <div className="input-group shadow-sm">
          <span className="input-group-text bg-light text-muted">@</span>
          <input 
            className="form-control" 
            value={username} 
            onChange={(e) => onUsernameChange(e.target.value)} 
          />
        </div>
      </div>

      {/* Gender Selection - Locked after confirmation */}
      <div className="mb-3">
        <label className="form-label small fw-bold text-uppercase text-muted">
          Gender
          {genderDisabled && (
            <span className="ms-2 badge bg-secondary" style={{ fontSize: "0.7rem" }}>
              <i className="bi bi-lock-fill me-1"></i> Locked
            </span>
          )}
        </label>
        <div className="d-flex gap-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="gender"
              id="genderMale"
              value="Male"
              checked={gender === "Male"}
              disabled={genderDisabled}
              onChange={(e) => onGenderChange(e.target.value)}
            />
            <label className={`form-check-label ${genderDisabled ? 'text-muted' : ''}`} htmlFor="genderMale">
              <i className="bi bi-gender-male me-1"></i> Male
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="gender"
              id="genderFemale"
              value="Female"
              checked={gender === "Female"}
              disabled={genderDisabled}
              onChange={(e) => onGenderChange(e.target.value)}
            />
            <label className={`form-check-label ${genderDisabled ? 'text-muted' : ''}`} htmlFor="genderFemale">
              <i className="bi bi-gender-female me-1"></i> Female
            </label>
          </div>
        </div>
        {genderDisabled && (
          <small className="text-muted d-block mt-1">
            <i className="bi bi-info-circle me-1"></i>
            Gender cannot be changed after confirmation
          </small>
        )}
      </div>

      {/* County Selection - Locked after confirmation */}
      <SearchableSelect
        options={KENYAN_COUNTIES}
        value={county}
        onChange={onCountyChange}
        placeholder="Select your county"
        label="County"
        disabled={countyDisabled}
      />

      {/* Save Button */}
      <button 
        className="btn btn-primary fw-bold w-100 py-2 shadow" 
        onClick={onSave} 
        disabled={saving}
      >
        {saving ? "Saving Changes..." : "Save Changes"}
      </button>
    </div>
  );
}