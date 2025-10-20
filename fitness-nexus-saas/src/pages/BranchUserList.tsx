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
// ➡️ ADDED ChevronLeft, ChevronRight
import { ChevronDown, ChevronUp, Users, Download, Search, ChevronLeft, ChevronRight } from "lucide-react"; 
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
  expiration_days_remaining: number | null;
}

// ❌ Removed border and background styles to avoid the badge/eclipse look.
const getStatusTextColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "text-green-700 font-semibold";
    case "inactive":
      return "text-slate-600 font-semibold";
    case "unpaid fees":
      return "text-red-700 font-semibold";
    case "pending enrollment":
      return "text-yellow-700 font-semibold";
    default:
      return "text-gray-600 font-semibold";
  }
};

// Helper function to render Expiration status with color coding (no rounded background)
const ExpirationStatus = ({ days }: { days: number | null }) => {
  if (days === null) {
    return <span className="text-gray-500 text-xs md:text-sm">N/A</span>;
  }
  
  // ❌ Removed rounded-full and background colors
  let className = "font-medium text-xs md:text-sm inline-block min-w-[3rem] text-left";
  let content = `${days}d`;
  
  if (days <= 0) {
    className = "font-bold text-red-700 text-xs md:text-sm";
    content = "Expired";
  } else if (days <= 7) {
    className = "font-bold text-orange-600 text-xs md:text-sm";
  } else if (days <= 30) {
    className = "text-yellow-600 text-xs md:text-sm";
  } else {
    className = "text-green-600 text-xs md:text-sm";
  }

  return <span className={className}>{content}</span>;
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
    // API call to fetch user data
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
          expiration_days_remaining: user.expiration_days_remaining !== undefined ? user.expiration_days_remaining : null, 
        }));
        setUsers(usersWithDefaults);
        setFilteredUsers(usersWithDefaults);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Filtering logic
    let filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

    if (genderFilter !== "All") filtered = filtered.filter((u) => u.gender === genderFilter);
    if (planFilter !== "All") filtered = filtered.filter((u) => u.opted_plan === planFilter);
    if (statusFilter !== "All") filtered = filtered.filter((u) => u.status === statusFilter);
    if (ageFilter > 0) filtered = filtered.filter((u) => u.age && u.age >= ageFilter);

    // Sorting logic
    filtered.sort((a, b) => sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [search, genderFilter, planFilter, statusFilter, ageFilter, sortOrder, users]);

  const downloadCSV = () => {
    const csvRows = [
      ["User ID", "Name", "Status", "Expiration Days", "Opted Plan", "Date Joined", "Gender", "Age"],
      ...filteredUsers.map((u) => [
        u.user_id,
        u.name,
        u.status,
        u.expiration_days_remaining !== null ? u.expiration_days_remaining.toString() : "N/A",
        u.opted_plan,
        u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "-",
        u.gender,
        u.age ? u.age.toString() : "N/A",
      ]),
    ];
    const csvString = csvRows.map((e) => e.map(item => `"${item}"`).join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
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
          <h1 className="text-2xl font-bold text-gray-800 logoOrange">Branch Members</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all enrolled members in this branch.</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Badge variant="outline" className="flex items-center space-x-2 py-2 px-3 text-sm font-semibold border-gray-300 text-gray-700 bg-white">
            <Users className="h-4 w-4 text-gray-600" />
            <span>Total: {users.length}</span>
          </Badge>
          <Button onClick={downloadCSV} variant="outline" size="sm" className="shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Filters and Search Card */}
      <Card className="mb-6 shadow-md border border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-2/5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by member name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto text-sm text-gray-700 hover:bg-gray-50"
            >
              {showFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
              {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-100">
              <div className="space-y-1.5">
                <Label htmlFor="status-filter" className="text-gray-600">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                  <SelectContent>{uniqueStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-filter" className="text-gray-600">Plan</Label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger id="plan-filter"><SelectValue placeholder="Filter by Plan" /></SelectTrigger>
                  <SelectContent>{uniquePlans.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender-filter" className="text-gray-600">Gender</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger id="gender-filter"><SelectValue placeholder="Filter by Gender" /></SelectTrigger>
                  <SelectContent>{uniqueGenders.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sort-order" className="text-gray-600">Sort By Name</Label>
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
      <Card className="shadow-md border border-gray-100 overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50">
            <TableRow className="border-b border-gray-200">
              {/* Optimized Column Widths for Mobile/Desktop Responsiveness */}
              <TableHead className="w-[45%] sm:w-[30%] text-gray-600 font-semibold">Member</TableHead>
              <TableHead className="w-[25%] sm:w-[15%] text-left text-gray-600 font-semibold">Status</TableHead>
              <TableHead className="w-[30%] sm:w-[15%] text-left text-gray-600 font-semibold">Expiring</TableHead>
              <TableHead className="w-[15%] hidden sm:table-cell text-left text-gray-600 font-semibold">Plan</TableHead>
              <TableHead className="hidden md:table-cell w-[15%] text-right text-gray-600 font-semibold">Joined</TableHead>
              <TableHead className="text-right hidden lg:table-cell w-[10%] text-gray-600 font-semibold">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <TableRow key={user.user_id} className="hover:bg-gray-50 border-b border-gray-100">
                  <TableCell className="py-3 px-2 sm:px-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Avatar className="h-9 w-9 border border-gray-200">
                        <AvatarImage src={user.profile_picture_url} alt={user.name} />
                        <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-800 text-sm">{user.name}</span>
                    </div>
                  </TableCell>

                  {/* Status (Visible on all screens) - Now just colored text */}
                  <TableCell className="py-3 px-2 sm:px-4 text-left">
                    <span className={`text-xs ${getStatusTextColor(user.status)}`}>
                      {user.status.replace(" ", "\u00A0")}
                    </span>
                  </TableCell>

                  {/* Expiration (Visible on all screens) - Now just colored text */}
                  <TableCell className="py-3 px-2 sm:px-4 text-left">
                    <ExpirationStatus days={user.expiration_days_remaining} />
                  </TableCell>
                  
                  {/* Opted Plan (Visible on sm and up) */}
                  <TableCell className="py-3 px-2 sm:px-4 hidden sm:table-cell text-gray-600 text-sm">
                    {user.opted_plan}
                  </TableCell>

                  {/* Date Joined (Visible on md and up) - Right aligned */}
                  <TableCell className="py-3 px-2 sm:px-4 hidden md:table-cell text-gray-600 text-sm text-right">
                    {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "—"}
                  </TableCell>

                  {/* Age (Visible on lg and up) - Right aligned */}
                  <TableCell className="py-3 px-2 sm:px-4 text-right hidden lg:table-cell text-gray-600 text-sm">
                    {user.age || "—"}
                  </TableCell>

                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
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

      {/* ➡️ Pagination Controls (SuperadminBilling Style) */}
      <div className="flex items-center justify-between mt-6">
        {/* Previous Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage((p) => p - 1)} 
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        
        {/* Page Count and Results Count (Center) */}
        <div className="flex flex-col items-center text-center">
          <div className="text-sm text-gray-700 font-medium">
            Page {totalPages > 0 ? currentPage : 0} of {totalPages > 0 ? totalPages : 0}
          </div>
          {/* Results count text for better context */}
          <div className="text-xs text-gray-500 mt-0.5 hidden sm:block"> 
            Showing <strong>{filteredUsers.length > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> results
          </div>
        </div>

        {/* Next Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage((p) => p + 1)} 
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default BranchUserList;