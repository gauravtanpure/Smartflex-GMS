// ManageFees.tsx
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
  user: { // Add nested user object for displaying user details from the fee endpoint
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    branch: string | null;
  };
}

export default function ManageFees() {
  const [users, setUsers] = useState<User[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [form, setForm] = useState({ user_id: "", fee_type: "", amount: "", due_date: "" });
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch users for the dropdown
    axios
      .get("http://localhost:8000/users/branch-users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setUsers(res.data))
      .catch(() => alert("Failed to load users"));

    // Fetch fee assignments for the branch
    fetchBranchFees();
  }, [token]);

  useEffect(() => {
    // Refetch fees when search query changes
    fetchBranchFees();
  }, [searchQuery]); // Add searchQuery to dependency array

  const fetchBranchFees = () => {
    axios
      .get(`http://localhost:8000/fees/branch?search_query=${searchQuery}`, { // Include search_query
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setFees(res.data))
      .catch(() => alert("Failed to load fees"));
  };

  const handleAssignFee = () => {
    // Basic validation
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
      .then(res => {
        alert("Fee assigned successfully!");
        setFees([...fees, res.data]);
        setForm({ user_id: "", fee_type: "", amount: "", due_date: "" }); // Clear form
      })
      .catch(error => {
        console.error("Fee assign failed:", error.response?.data || error.message);
        alert(`Fee assign failed: ${error.response?.data?.detail || "Unknown error"}`);
      });
  };

  const handleTogglePaidStatus = (feeId: number, currentStatus: boolean) => {
    axios
      .put(`http://localhost:8000/fees/${feeId}/status`, { is_paid: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        alert("Payment status updated!");
        // Update the state to reflect the change
        setFees(fees.map(fee => (fee.id === feeId ? { ...fee, is_paid: res.data.is_paid } : fee)));
      })
      .catch(error => {
        console.error("Failed to update payment status:", error.response?.data || error.message);
        alert(`Failed to update payment status: ${error.response?.data?.detail || "Unknown error"}`);
      });
  };


  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Fees</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-xl font-semibold mb-3">Assign New Fee</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            value={form.user_id}
            onChange={e => setForm({ ...form, user_id: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="">Select User</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Fee Type (e.g., Monthly Membership)"
            value={form.fee_type}
            onChange={e => setForm({ ...form, fee_type: e.target.value })}
            className="p-2 border rounded"
          />

          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className="p-2 border rounded"
          />

          <input
            type="date"
            value={form.due_date}
            onChange={e => setForm({ ...form, due_date: e.target.value })}
            className="p-2 border rounded"
          />

          <button onClick={handleAssignFee} className="bg-blue-600 text-white px-4 py-2 rounded col-span-full md:col-span-1">
            Assign Fee
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-3">Existing Fee Assignments</h3>
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>
        {fees.length === 0 ? (
          <p>No fee assignments found for your branch.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b">User Name</th>
                  <th className="px-4 py-2 border-b">Fee Type</th>
                  <th className="px-4 py-2 border-b">Amount</th>
                  <th className="px-4 py-2 border-b">Due Date</th>
                  <th className="px-4 py-2 border-b">Branch</th>
                  <th className="px-4 py-2 border-b">Paid Status</th>
                  <th className="px-4 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => {
                  // Use fee.user directly from the Fee object
                  const userDisplayName = fee.user ? `${fee.user.name} (${fee.user.email})` : `User ID: ${fee.user_id}`;
                  return (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b text-center">{userDisplayName}</td>
                      <td className="px-4 py-2 border-b text-center">{fee.fee_type}</td>
                      <td className="px-4 py-2 border-b text-center">₹{fee.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 border-b text-center">{fee.due_date}</td>
                      <td className="px-4 py-2 border-b text-center">{fee.branch_name || "N/A"}</td>
                      <td className="px-4 py-2 border-b text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            fee.is_paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
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
        )}
      </div>
    </div>
  );
}