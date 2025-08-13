import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, ArrowDown, ArrowUp, Users as UsersIcon, Download } from "lucide-react";
import { Label } from "@/components/ui/label";

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
  const [statusFilter, setStatusFilter] = useState("All");
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
        const usersWithDefaults = res.data.map((user: EnrolledUser) => ({
          ...user,
          gender: user.gender || "Not Specified",
          opted_plan: user.opted_plan || "None",
          age: user.age || 18,
          status: user.status || "Unknown",
        }));
        setUsers(usersWithDefaults);
        setFilteredUsers(usersWithDefaults);
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
      filtered = filtered = filtered.filter((u) => u.opted_plan === planFilter);
    }

    if (statusFilter !== "All") {
      filtered = filtered.filter((u) => u.status === statusFilter);
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
  }, [search, genderFilter, planFilter, statusFilter, ageFilter, sortOrder, users]);

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

  const uniquePlans = ["All", ...new Set(users.map((u) => u.opted_plan))];
  const uniqueGenders = ["All", ...new Set(users.map((u) => u.gender))];
  const uniqueStatuses = ["All", ...new Set(users.map((u) => u.status))];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl logoOrange">Branch Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all enrolled members in this branch.</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <Badge variant="outline" className="flex items-center space-x-2 py-2 px-4 text-sm font-semibold">
            <UsersIcon className="h-4 w-4 text-blue-500" />
            <span>Total Members: {users.length}</span>
          </Badge>
          <Button onClick={downloadCSV} className="w-full sm:w-auto flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="w-full md:w-1/3">
              <Input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto flex items-center space-x-2 text-blue-600 hover:bg-blue-50"
            >
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-1">
              <div className="space-y-1">
                <Label htmlFor="gender-filter">Gender</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger id="gender-filter" className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueGenders.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="plan-filter">Plan</Label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger id="plan-filter" className="w-full">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniquePlans.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="min-age">Minimum Age</Label>
                <Input
                  id="min-age"
                  type="number"
                  placeholder="Min Age"
                  value={ageFilter > 0 ? ageFilter : ""}
                  onChange={(e) => setAgeFilter(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sort-order">Sort By Name</Label>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                  <SelectTrigger id="sort-order" className="w-full">
                    <SelectValue placeholder="Sort Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A-Z</SelectItem>
                    <SelectItem value="desc">Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="shadow-sm">
        <Table className="w-full">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-2/12">Name</TableHead>
              <TableHead className="w-2/12 hidden md:table-cell">Date Joined</TableHead>
              <TableHead className="w-2/12 hidden sm:table-cell">Opted Plan</TableHead>
              <TableHead className="w-2/12 hidden lg:table-cell">Status</TableHead>
              <TableHead className="w-2/12 hidden sm:table-cell">Gender</TableHead>
              <TableHead className="w-1/12 text-center hidden md:table-cell">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? (
              currentUsers.map((u) => (
                <TableRow key={u.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{u.opted_plan}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={u.status === "Active" ? "default" : "secondary"}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{u.gender}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">{u.age}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center gap-4 mt-6">
        <div className="text-sm text-gray-500">
          Showing {filteredUsers.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            variant="outline"
            size="sm"
          >
            Prev
          </Button>
          <span className="text-sm text-gray-700">
            Page {totalPages > 0 ? currentPage : 0} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BranchUserList;