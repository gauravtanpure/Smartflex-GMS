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
  const [filteredUsers, setFilteredUsers] = useState<EnrolledUser[]>([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState(0);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    axios
      .get("http://localhost:8000/users/branch-enrollments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const usersWithDummy = res.data.map((user: EnrolledUser) => ({
          ...user,
          gender: user.gender || "Not Specified",
          opted_plan: user.opted_plan || "None",
          age: user.age || 18,
        }));
        setUsers(usersWithDummy);
        setFilteredUsers(usersWithDummy);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let filtered = [...users];

    if (search.trim()) {
      filtered = filtered.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (genderFilter !== "All") {
      filtered = filtered.filter((u) => u.gender === genderFilter);
    }

    if (planFilter !== "All") {
      filtered = filtered.filter((u) => u.opted_plan === planFilter);
    }

    if (ageFilter > 0) {
      filtered = filtered.filter((u) => u.age >= ageFilter);
    }

    filtered.sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [search, genderFilter, planFilter, ageFilter, sortOrder, users]);

  const downloadCSV = () => {
    const csvRows = [
      ["User ID", "Name", "Date Joined", "Opted Plan", "Status", "Gender", "Age"],
      ...filteredUsers.map((u) => [
        u.user_id,
        u.name,
        u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "-",
        u.opted_plan,
        u.status,
        u.gender,
        u.age.toString(),
      ]),
    ];

    const blob = new Blob([csvRows.map((e) => e.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "branch_users.csv";
    a.click();
  };

  const uniquePlans = [...new Set(users.map((u) => u.opted_plan))];
  const uniqueGenders = [...new Set(users.map((u) => u.gender))];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Search Bar - Left */}
        <input
          type="text"
          placeholder="Search by name"
          className="border px-3 py-2 rounded w-full sm:w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Buttons - Right */}
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button onClick={downloadCSV}>Export CSV</Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4">
          <select
            className="border px-3 py-2 rounded"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="All">All Genders</option>
            {uniqueGenders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            className="border px-3 py-2 rounded"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="All">All Plans</option>
            {uniquePlans.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <input
            type="number"
            className="border px-3 py-2 rounded w-24"
            placeholder="Min Age"
            value={ageFilter}
            onChange={(e) => setAgeFilter(Number(e.target.value))}
          />

          <select
            className="border px-3 py-2 rounded"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          >
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100 text-left">
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
            {currentUsers.length > 0 ? (
              currentUsers.map((u) => (
                <tr key={u.user_id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">
                    {u.date_joined
                      ? new Date(u.date_joined).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-3 py-2">{u.opted_plan}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="px-3 py-2">{u.gender}</td>
                  <td className="px-3 py-2">{u.age}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-3">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 pt-4">
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          variant="outline"
        >
          Prev
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default BranchUserList;
