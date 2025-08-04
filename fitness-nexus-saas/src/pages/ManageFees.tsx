// ManageFees.tsx
import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  name: string;
  email: string;
}

// Interface for a single Fee assignment
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

// Interface for a single Membership Plan
interface Plan {
  id: number;
  plan_name: string;
  price: number;
}

export default function ManageFees() {
  const [users, setUsers] = useState<User[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]); // State for membership plans
  const [form, setForm] = useState({ user_id: "", plan_id: "", fee_type: "", amount: "", due_date: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch users for the dropdown
        const usersRes = await axios.get("http://localhost:8000/users/branch-users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data);

        // Fetch approved membership plans for the branch
        const plansRes = await axios.get("http://localhost:8000/membership-plans/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(plansRes.data);

      } catch (error) {
        alert("Failed to load initial data (users or plans).");
      }
    };

    fetchInitialData();
    fetchBranchFees(); // Initial fetch for fees
  }, [token]);

  useEffect(() => {
    // Refetch fees when search query changes
    fetchBranchFees();
  }, [searchQuery]);

  const fetchBranchFees = () => {
    // Note: The backend endpoint doesn't currently support search_query, but the frontend is ready if it's added.
    axios
      .get(`http://localhost:8000/fees/branch?search_query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setFees(res.data))
      .catch(() => alert("Failed to load fees"));
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPlanId = e.target.value;
    const selectedPlan = plans.find(p => p.id.toString() === selectedPlanId);

    if (selectedPlan) {
      setForm({
        ...form,
        plan_id: selectedPlanId,
        fee_type: selectedPlan.plan_name,
        amount: selectedPlan.price.toString(), // Auto-fill amount
      });
    } else {
      // Reset if "Select Plan" is chosen
      setForm({ ...form, plan_id: "", fee_type: "", amount: "" });
    }
  };

  const handleSendNotification = () => {
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
        alert("Fee assigned and notification sent successfully!");
        setFees([...fees, res.data]); // Add new fee to the list
        fetchBranchFees(); // Or refetch to be safe
        setForm({ user_id: "", plan_id: "", fee_type: "", amount: "", due_date: "" }); // Clear form
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* User Selection */}
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

          {/* Plan Selection (Replaces Fee Type Input) */}
          <select
            value={form.plan_id}
            onChange={handlePlanChange}
            className="p-2 border rounded"
          >
            <option value="">Select Plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.plan_name}
              </option>
            ))}
          </select>

          {/* Amount (Read-only, auto-filled) */}
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            readOnly // Make it read-only
            className="p-2 border rounded bg-gray-100" // Style to show it's read-only
          />

          {/* Due Date */}
          <input
            type="date"
            value={form.due_date}
            onChange={e => setForm({ ...form, due_date: e.target.value })}
            className="p-2 border rounded"
          />

          {/* Button */}
          <button onClick={handleSendNotification} className="bg-blue-600 text-white px-4 py-2 rounded md:col-span-2 lg:col-span-1">
            Send Notification
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