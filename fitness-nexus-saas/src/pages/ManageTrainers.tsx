export default function ManageTrainers() {
  const branch = localStorage.getItem("branch") || "Unknown Branch";
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-foreground">Manage Trainers</h1>
      <p className="text-muted-foreground">Branch: {branch}</p>
      {/* Trainer management UI coming soon */}
    </div>
  );
}
