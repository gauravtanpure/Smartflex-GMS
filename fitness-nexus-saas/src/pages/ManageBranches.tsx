import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManageBranches() {
  const branches = [
    { name: "Pune Branch", admin: "admin_pune@smartflex.com" },
    { name: "Mumbai Branch", admin: "admin_mumbai@smartflex.com" },
    { name: "Nagpur Branch", admin: "admin_nagpur@smartflex.com" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Manage Branches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{branch.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Admin: {branch.admin}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
