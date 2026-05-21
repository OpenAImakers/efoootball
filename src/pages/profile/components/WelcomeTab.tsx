interface WelcomeTabProps {
  profile: { username: string | null; display_name: string | null; profile_pic: string | null } | null;
}

export default function WelcomeTab({ profile }: WelcomeTabProps) {
  return (
    <>
      <h4 className="fw-bold text-primary">Welcome, {profile?.display_name || profile?.username}!</h4>
      <p className="text-muted">Explore your stats using the tabs.</p>
    </>
  );
}