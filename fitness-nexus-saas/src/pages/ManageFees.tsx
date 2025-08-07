import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Fee {
  id: number;
  user_id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  branch_name: string;
  assigned_by_user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    branch: string | null;
  };
}

interface Plan {
  id: number;
  plan_name: string;
  price: number;
}

export default function ManageFees() {
  const [users, setUsers] = useState<User[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ user_id: "", plan_id: "", fee_type: "", amount: "", due_date: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");

  const [currentPage, setCurrentPage] = useState(1);
  const feesPerPage = 6;

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usersRes = await axios.get("http://localhost:8000/users/branch-users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data);

        const plansRes = await axios.get("http://localhost:8000/membership-plans/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(plansRes.data);
      } catch {
        alert("Failed to load users or plans.");
      }
    };

    fetchInitialData();
    fetchBranchFees();
  }, [token]);

  useEffect(() => {
    fetchBranchFees();
  }, [searchQuery]);

  const fetchBranchFees = () => {
    axios
      .get(`http://localhost:8000/fees/branch?search_query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setFees(res.data))
      .catch(() => alert("Failed to load fees"));
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPlan = plans.find(p => p.id.toString() === e.target.value);
    if (selectedPlan) {
      setForm({
        ...form,
        plan_id: selectedPlan.id.toString(),
        fee_type: selectedPlan.plan_name,
        amount: selectedPlan.price.toString(),
      });
    } else {
      setForm({ ...form, plan_id: "", fee_type: "", amount: "" });
    }
  };

  const handleSendNotification = () => {
    if (!form.user_id || !form.fee_type || !form.amount || !form.due_date) {
      alert("Please fill all fields.");
      return;
    }

    axios
      .post("http://localhost:8000/fees", {
        user_id: parseInt(form.user_id),
        fee_type: form.fee_type,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Fee assigned successfully!");
        fetchBranchFees();
        setForm({ user_id: "", plan_id: "", fee_type: "", amount: "", due_date: "" });
      })
      .catch(error => {
        alert(`Fee assign failed: ${error.response?.data?.detail || "Unknown error"}`);
      });
  };

  const handleTogglePaidStatus = (feeId: number, currentStatus: boolean) => {
    axios
      .put(`http://localhost:8000/fees/${feeId}/status`, { is_paid: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        fetchBranchFees();
      })
      .catch(() => alert("Failed to update payment status."));
  };

  const filteredFees = fees.filter(fee => {
    if (filterStatus === "paid") return fee.is_paid;
    if (filterStatus === "unpaid") return !fee.is_paid;
    return true;
  });

  const exportToCSV = () => {
    const rows = [
      ["User Name", "Email", "Fee Type", "Amount", "Due Date", "Branch", "Status"],
      ...filteredFees.map(fee => [
        fee.user?.name || "N/A",
        fee.user?.email || "N/A",
        fee.fee_type,
        `₹${fee.amount.toFixed(2)}`,
        fee.due_date,
        fee.branch_name || "N/A",
        fee.is_paid ? "Paid" : "Unpaid"
      ])
    ];

    const csvContent = rows.map(row => row.map(item => `"${item}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "fee_assignments.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredFees.length / feesPerPage);
  const paginatedFees = filteredFees.slice(
    (currentPage - 1) * feesPerPage,
    currentPage * feesPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="p-2" font-poppins>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold" style={{ color: "#6b7e86" }}>Manage Fees</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={exportToCSV}
        >
          Export CSV
        </button>
      </div>

      {/* Assign New Fee */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-xl font-semibold mb-3">Assign New Fee</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <select
            value={form.user_id}
            onChange={e => setForm({ ...form, user_id: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">Select User</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>

          <select
            value={form.plan_id}
            onChange={handlePlanChange}
            className="p-2 border rounded"
          >
            <option value="">Select Plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.plan_name}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            readOnly
            className="p-2 border rounded bg-gray-100"
          />

          <input
            type="date"
            value={form.due_date}
            onChange={e => setForm({ ...form, due_date: e.target.value })}
            className="p-2 border rounded"
          />

          <button
            onClick={handleSendNotification}
            className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-2 lg:col-span-1"
          >
            Send Notification
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="p-2 border rounded w-full md:w-1/2"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="p-2 border rounded w-full md:w-[200px]"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Fee Table */}
      <div className="bg-white p-4 rounded shadow">
        {filteredFees.length === 0 ? (
          <p>No fee assignments found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b">User</th>
                    <th className="px-4 py-2 border-b">Fee Type</th>
                    <th className="px-4 py-2 border-b">Amount</th>
                    <th className="px-4 py-2 border-b">Due Date</th>
                    <th className="px-4 py-2 border-b">Branch</th>
                    <th className="px-4 py-2 border-b">Status</th>
                    <th className="px-4 py-2 border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFees.map(fee => {
                    const userDisplay = fee.user ? `${fee.user.name} (${fee.user.email})` : `User ID: ${fee.user_id}`;
                    return (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border-b text-center">{userDisplay}</td>
                        <td className="px-4 py-2 border-b text-center">{fee.fee_type}</td>
                        <td className="px-4 py-2 border-b text-center">₹{fee.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 border-b text-center">
                          {new Date(fee.due_date).toLocaleDateString("en-GB")}
                        </td>

                        <td className="px-4 py-2 border-b text-center">{fee.branch_name || "N/A"}</td>
                        <td className="px-4 py-2 border-b text-center">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            fee.is_paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {fee.is_paid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-2 border-b text-center">
                          <button
                            onClick={() => handleTogglePaidStatus(fee.id, fee.is_paid)}
                            className={`px-3 py-1 rounded text-white text-sm ${
                              fee.is_paid ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
                            }`}
                          >
                            {fee.is_paid ? "Mark Unpaid" : "Mark Paid"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1 ? "bg-blue-600 text-white" : ""
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
