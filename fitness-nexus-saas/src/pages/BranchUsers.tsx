import { useEffect, useState } from "react";
import axios from "axios";

interface BranchUser {
  name: string;
  email: string;
  phone: string;
  gender: string;
}

export default function BranchUsers() {
  const [users, setUsers] = useState<BranchUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/users/branch-users-minimal", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data);
      } catch (err) {
        console.error("Failed to fetch branch users", err);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Branch Users</h2>
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left text-sm">
            <th className="py-2 px-4">Name</th>
            <th className="py-2 px-4">Email</th>
            <th className="py-2 px-4">Phone</th>
            <th className="py-2 px-4">Gender</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={index} className="border-t text-sm">
              <td className="py-2 px-4">{u.name}</td>
              <td className="py-2 px-4">{u.email}</td>
              <td className="py-2 px-4">{u.phone}</td>
              <td className="py-2 px-4">{u.gender || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
