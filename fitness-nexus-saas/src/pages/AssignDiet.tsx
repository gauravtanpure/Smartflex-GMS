import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  name: string;
  email: string;
}

interface DietPlan {
  id: number;
  user_id: number;
  assigned_by_trainer_id: number;
  title: string;
  description: string;
  assigned_date: string;
  expiry_date: string | null;
  branch_name: string;
  user: { name: string; email: string; };
  assigned_by_trainer: { name: string; email: string; };
}

export default function AssignDiet() {
  const [users, setUsers] = useState<User[]>([]);
  const [assignedDietPlans, setAssignedDietPlans] = useState<DietPlan[]>([]);
  const [form, setForm] = useState({ user_id: "", title: "", description: "", expiry_date: "" });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", expiry_date: "" });
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch users from the trainer's branch
  useEffect(() => {
    axios
      .get("http://localhost:8000/users/branch-users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setUsers(res.data);
        setLoadingUsers(false);
      })
      .catch(error => {
        console.error("Failed to load users for diet assignment:", error);
        setError(`Failed to load users: ${error.response?.data?.detail || error.message}`);
        setLoadingUsers(false);
      });
  }, [token]);

  // Fetch diet plans assigned by the current trainer
  const fetchAssignedDietPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await axios.get("http://localhost:8000/trainers/diet-plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignedDietPlans(res.data);
    } catch (err: any) {
      console.error("Failed to fetch assigned diet plans:", err);
      setError(`Failed to load assigned plans: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchAssignedDietPlans();
  }, [token]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id || !form.title || !form.description) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/trainers/diet-plans", {
        user_id: parseInt(form.user_id),
        title: form.title,
        description: form.description,
        expiry_date: form.expiry_date || null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Diet plan assigned successfully!");
      fetchAssignedDietPlans(); // Re-fetch plans to update the list
      setForm({ user_id: "", title: "", description: "", expiry_date: "" }); // Clear form
    } catch (error: any) {
      console.error("Failed to assign diet plan:", error.response?.data || error.message);
      alert(`Failed to assign diet plan: ${error.response?.data?.detail || "Unknown error"}`);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!window.confirm("Are you sure you want to delete this diet plan?")) {
      return;
    }
    try {
      await axios.delete(`http://localhost:8000/trainers/diet-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Diet plan deleted successfully!");
      fetchAssignedDietPlans(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to delete diet plan:", error.response?.data || error.message);
      alert(`Failed to delete diet plan: ${error.response?.data?.detail || "Unknown error"}`);
    }
  };

  const handleEdit = (plan: DietPlan) => {
    setEditingPlanId(plan.id);
    setEditForm({
      title: plan.title,
      description: plan.description,
      expiry_date: plan.expiry_date || "",
    });
  };

  const handleSaveEdit = async (planId: number) => {
    try {
      // Find the original plan to get the user_id
      const originalPlan = assignedDietPlans.find(p => p.id === planId);
      if (!originalPlan) {
        alert("Original plan not found.");
        return;
      }

      await axios.put(`http://localhost:8000/trainers/diet-plans/${planId}`, {
        user_id: originalPlan.user_id, // User ID cannot be changed, send original
        title: editForm.title,
        description: editForm.description,
        expiry_date: editForm.expiry_date || null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Diet plan updated successfully!");
      setEditingPlanId(null); // Exit editing mode
      fetchAssignedDietPlans(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to update diet plan:", error.response?.data || error.message);
      alert(`Failed to update diet plan: ${error.response?.data?.detail || "Unknown error"}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditForm({ title: "", description: "", expiry_date: "" });
  };


  if (loadingUsers || loadingPlans) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6" font-poppins>
      <h2 className="text-2xl font-bold mb-4">Assign Diet Plan</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4 mb-8">
        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">Select User:</label>
          <select
            id="user_id"
            name="user_id"
            value={form.user_id}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            required
          >
            <option value="">-- Select a User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="e.g., Keto Diet for Weight Loss"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={6}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="Provide a detailed diet plan (e.g., Meal 1: ..., Meal 2: ...)"
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700">Expiry Date (Optional):</label>
          <input
            type="date"
            id="expiry_date"
            name="expiry_date"
            value={form.expiry_date}
            onChange={handleChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Assign Diet Plan
        </button>
      </form>

      <h2 className="text-2xl font-bold mb-4">Assigned Diet Plans</h2>
      {assignedDietPlans.length === 0 ? (
        <p className="text-gray-600">No diet plans assigned by you yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignedDietPlans.map(plan => (
                <tr key={plan.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {plan.user?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingPlanId === plan.id ? (
                      <input
                        type="text"
                        name="title"
                        value={editForm.title}
                        onChange={handleEditChange}
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      plan.title
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {editingPlanId === plan.id ? (
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        className="w-full p-1 border rounded"
                        rows={3}
                      />
                    ) : (
                      plan.description
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.branch_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {plan.assigned_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingPlanId === plan.id ? (
                      <input
                        type="date"
                        name="expiry_date"
                        value={editForm.expiry_date}
                        onChange={handleEditChange}
                        className="w-full p-1 border rounded"
                      />
                    ) : (
                      plan.expiry_date || 'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingPlanId === plan.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(plan.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(plan)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}