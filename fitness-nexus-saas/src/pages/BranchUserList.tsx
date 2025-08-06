import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface EnrolledUser {
  user_id: number;
  name: string;
  date_joined: string;
  opted_plan: string;
  status: string;
  gender: string;
  age: number;
}

const BranchUserList = () => {
  const [users, setUsers] = useState<EnrolledUser[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/users/branch-enrollments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setUsers(res.data))
      .catch(console.error);
  }, []);

  const downloadCSV = () => {
    const csvRows = [
      ["User ID", "Name", "Date Joined", "Opted Plan", "Status", "Gender", "Age"],
      ...users.map(u =>
        [
          u.user_id,
          u.name,
          u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "-",
          u.opted_plan || "-",
          u.status,
          u.gender || "-",
          u.age || "-"
        ]
      )
    ];

    const blob = new Blob(
      [csvRows.map(e => e.join(",")).join("\n")],
      { type: "text/csv;charset=utf-8;" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "branch_users.csv";
    a.click();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Users Enrolled in Your Branch</h2>
      <Button onClick={downloadCSV} className="mb-4">Export CSV</Button>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Name</th>
              <th className="px-3 py-2 border">Date Joined</th>
              <th className="px-3 py-2 border">Opted Plan</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Gender</th>
              <th className="px-3 py-2 border">Age</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(users) && users.length > 0 ? (
                users.map((u) => (
                <tr key={u.user_id} className="border-t">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "-"}</td>
                    <td className="px-3 py-2">{u.opted_plan || "-"}</td>
                    <td className="px-3 py-2">{u.status}</td>
                    <td className="px-3 py-2">{u.gender || "-"}</td>
                    <td className="px-3 py-2">{u.age || "-"}</td>
                </tr>
                ))
            ) : (
                <tr>
                <td className="px-3 py-2" colSpan={6}>No users found or error loading data.</td>
                </tr>
            )}
            </tbody>

        </table>
      </div>
    </div>
  );
};

export default BranchUserList;