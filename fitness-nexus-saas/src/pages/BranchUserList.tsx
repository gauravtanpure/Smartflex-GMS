// src/components/your-path/BranchUserList.tsx

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Users, Download, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

interface EnrolledUser {
  user_id: number;
  name: string;
  date_joined: string;
  opted_plan: string | null;
  status: string;
  gender: string | null;
  age: number | null;
  profile_picture_url?: string;
}

const getStatusTextColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "text-green-600";
    case "inactive":
      return "text-slate-600";
    case "unpaid fees":
      return "text-red-600";
    case "pending enrollment":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
};

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
      .get(`${import.meta.env.VITE_API_URL}/users/branch-enrollments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        const usersWithDefaults = res.data.map((user: EnrolledUser) => ({
          ...user,
          gender: user.gender || "N/A",
          opted_plan: user.opted_plan || "Not Enrolled",
          age: user.age || null,
          status: user.status || "Unknown",
        }));
        setUsers(usersWithDefaults);
        setFilteredUsers(usersWithDefaults);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

    if (genderFilter !== "All") filtered = filtered.filter((u) => u.gender === genderFilter);
    if (planFilter !== "All") filtered = filtered.filter((u) => u.opted_plan === planFilter);
    if (statusFilter !== "All") filtered = filtered.filter((u) => u.status === statusFilter);
    if (ageFilter > 0) filtered = filtered.filter((u) => u.age && u.age >= ageFilter);

    filtered.sort((a, b) => sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

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
        u.age ? u.age.toString() : "N/A",
      ]),
    ];
    const blob = new Blob([csvRows.map((e) => e.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "branch_members.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const uniquePlans = ["All", ...Array.from(new Set(users.map((u) => u.opted_plan)))];
  const uniqueGenders = ["All", ...Array.from(new Set(users.map((u) => u.gender)))];
  const uniqueStatuses = ["All", ...Array.from(new Set(users.map((u) => u.status)))];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl text-gray-800 logoOrange">Branch Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all enrolled members in this branch.</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Badge variant="outline" className="flex items-center space-x-2 py-2 px-3 text-sm font-semibold border-gray-300">
            <Users className="h-4 w-4 text-gray-600" />
            <span>Total: {users.length}</span>
          </Badge>
          <Button onClick={downloadCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Filters and Search Card */}
      <Card className="mb-6 shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-2/5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by member name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto text-sm"
            >
              {showFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t">
              <div className="space-y-1.5">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                  <SelectContent>{uniqueStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-filter">Plan</Label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger id="plan-filter"><SelectValue placeholder="Filter by Plan" /></SelectTrigger>
                  <SelectContent>{uniquePlans.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender-filter">Gender</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger id="gender-filter"><SelectValue placeholder="Filter by Gender" /></SelectTrigger>
                  <SelectContent>{uniqueGenders.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sort-order">Sort By Name</Label>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                  <SelectTrigger id="sort-order"><SelectValue placeholder="Sort Order" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Name (A-Z)</SelectItem>
                    <SelectItem value="desc">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Table Card */}
      <Card className="shadow-sm border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[35%]">Member</TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Opted Plan</TableHead>
              <TableHead className="hidden md:table-cell">Date Joined</TableHead>
              <TableHead className="text-right hidden md:table-cell">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <TableRow key={user.user_id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.profile_picture_url} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className={`font-semibold ${getStatusTextColor(user.status)}`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-600">
                    {user.opted_plan}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-600">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell text-gray-600">
                    {user.age || "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-10 w-10 text-gray-400" />
                    <p className="font-semibold text-gray-700">No Members Found</p>
                    <p className="text-sm text-gray-500">
                      No members match your current filter criteria.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ✨ MODIFIED: Pagination is now always visible */}
      <div className="flex justify-between items-center gap-4 mt-6">
        <div className="text-sm text-gray-600">
          Showing <strong>{filteredUsers.length > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            variant="outline" size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700 font-medium">
            Page {totalPages > 0 ? currentPage : 0} of {totalPages > 0 ? totalPages : 0}
          </span>
          <Button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            variant="outline" size="sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BranchUserList;