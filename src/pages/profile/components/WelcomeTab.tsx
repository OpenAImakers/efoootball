import React from "react";

interface WelcomeTabProps {
  profile: {
    username: string | null;
    display_name: string | null;
    profile_pic: string | null;
  } | null;
}

export default function WelcomeTab({ profile }: WelcomeTabProps) {
  const milestones = [
    {
      icon: "bi-person-check-fill",
      title: "Account Registered",
      completed: true,
    },
    {
      icon: "bi-pencil-square",
      title: "Complete Profile",
      completed: false,
    },
    {
      icon: "bi-controller",
      title: "Update Rating",
      completed: false,
    },
    {
      icon: "bi-calendar-event",
      title: "Join First Tournament",
      completed: false,
    },
    {
      icon: "bi-joystick",
      title: "Play First Match",
      completed: false,
    },
    {
      icon: "bi-trophy",
      title: "Win First Match",
      completed: false,
    },
    {
      icon: "bi-star",
      title: "Earn First Ranking Point",
      completed: false,
    },
    {
      icon: "bi-bar-chart-line",
      title: "Reach Top 100",
      completed: false,
    },
    {
      icon: "bi-lightning-charge",
      title: "Reach Top 50",
      completed: false,
    },
    {
      icon: "bi-award",
      title: "Reach Top 10",
      completed: false,
    },
    {
      icon: "bi-cup-hot",
      title: "Win Your First Tournament",
      completed: false,
    },
    {
      icon: "bi-gem",
      title: "Become a Seasonal Qualifier",
      completed: false,
    },
    {
      icon: "bi-crown-fill",
      title: "Qualify for National Finals",
      completed: false,
    },
    {
  icon: "bi-megaphone-fill",
  title: "Commentate a Match",
  completed: false,
},
{
  icon: "bi-person-plus-fill",
  title: "Create a Tournament Registration",
  completed: false,
},
{
  icon: "bi-trophy-fill",
  title: "Host Your First Tournament",
  completed: false,
},
{
  icon: "bi-cash-coin",
  title: "Earn Over KSh 100",
  completed: false,
},
{
  icon: "bi-wallet2",
  title: "Earn Over KSh 500",
  completed: false,
},
{
  icon: "bi-bank",
  title: "Earn Over KSh 1,000",
  completed: false,
},
{
  icon: "bi-fire",
  title: "Earn Over KSh 5,000",
  completed: false,
},
{
  icon: "bi-gem",
  title: "Become a Community Contributor",
  completed: false,
},
{
  icon: "bi-people-fill",
  title: "Recruit 5 New Players",
  completed: false,
},
{
  icon: "bi-award-fill",
  title: "Become a Verified Tournament Organizer",
  completed: false,
},
{
  icon: "bi-star-fill",
  title: "Earn 100 Ranking Points",
  completed: false,
},
{
  icon: "bi-stars",
  title: "Earn 500 Ranking Points",
  completed: false,
},
{
  icon: "bi-lightning-charge-fill",
  title: "Earn 1,000 Ranking Points",
  completed: false,
},
{
  icon: "bi-globe-africa",
  title: "Represent Your County",
  completed: false,
},
{
  icon: "bi-shield-check",
  title: "Complete All Beginner Milestones",
  completed: false,
}
  ];

  const completedCount = milestones.filter((m) => m.completed).length;
  const progress = Math.round(
    (completedCount / milestones.length) * 100
  );

  return (
    <div>
      <h4 className="fw-bold text-primary mb-2">
        Welcome, {profile?.display_name || profile?.username}!
      </h4>

      <p className="text-muted mb-4">
        Complete milestones, climb the rankings, and earn your place among
        Kenya's top eFootball competitors.
      </p>

      {/* Progress Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold mb-0">
              <i className="bi bi-map me-2"></i>
              Player Journey
            </h5>
            <span className="badge bg-primary fs-6">
              {progress}% Complete
            </span>
          </div>

          <div className="progress" style={{ height: "10px" }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <small className="text-muted">
            {completedCount} of {milestones.length} milestones completed
          </small>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h5 className="fw-bold mb-4">
            <i className="bi bi-signpost-split-fill me-2"></i>
            Road to Champion
          </h5>

          <div className="d-flex flex-column gap-3">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`d-flex align-items-center p-3 rounded ${
                  milestone.completed
                    ? "bg-success bg-opacity-10"
                    : "bg-light"
                }`}
              >
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                    milestone.completed
                      ? "bg-success text-white"
                      : "bg-secondary text-white"
                  }`}
                  style={{
                    width: "42px",
                    height: "42px",
                    minWidth: "42px",
                  }}
                >
                  <i className={`bi ${milestone.icon}`}></i>
                </div>

                <div className="flex-grow-1">
                  <div className="fw-semibold">
                    {milestone.title}
                  </div>
                </div>

                {milestone.completed ? (
                  <i className="bi bi-check-circle-fill text-success fs-4"></i>
                ) : (
                  <i className="bi bi-circle text-secondary fs-5"></i>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Achievements */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-stars me-2"></i>
            Unlockable Achievements
          </h5>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <i className="bi bi-fire fs-2 text-warning"></i>
                <div className="fw-semibold mt-2">
                  3 Match Win Streak
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <i className="bi bi-trophy-fill fs-2 text-warning"></i>
                <div className="fw-semibold mt-2">
                  Tournament Champion
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <i className="bi bi-crown-fill fs-2 text-warning"></i>
                <div className="fw-semibold mt-2">
                  Seasonal Top 10
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}