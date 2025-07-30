import { useEffect, useState } from "react";
import axios from "axios";

interface ExercisePlan {
  id: number;
  user_id: number;
  assigned_by_trainer_id: number;
  title: string;
  description: string;
  assigned_date: string;
  expiry_date: string | null;
  branch_name: string;
  user: { name: string; email: string; }; // Simplified for display
  assigned_by_trainer: { name: string; email: string; }; // Simplified for display
}

export default function MyExercise() {
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token"); //

  useEffect(() => {
    const fetchMyExercisePlans = async () => {
      try {
        const res = await axios.get("http://localhost:8000/users/my-exercise-plans", { //
          headers: { Authorization: `Bearer ${token}` }, //
        });
        setExercisePlans(res.data); //
      } catch (err: any) {
        console.error("Failed to fetch exercise plans:", err); //
        setError(`Failed to load exercise plans: ${err.response?.data?.detail || err.message}`); //
      } finally {
        setLoading(false); //
      }
    };

    fetchMyExercisePlans();
  }, [token]);

  if (loading) {
    return <div className="p-6 text-center">Loading exercise plans...</div>; //
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>; //
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Exercise Plans</h2>
      {exercisePlans.length === 0 ? (
        <p className="text-gray-600">No exercise plans assigned to you yet.</p> //
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercisePlans.map(plan => (
            <div key={plan.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-primary mb-2">{plan.title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                Assigned by: <span className="font-medium">{plan.assigned_by_trainer?.name || 'N/A'}</span> ({plan.assigned_by_trainer?.email || 'N/A'})
              </p>
              <div className="prose prose-sm max-w-none mb-4" dangerouslySetInnerHTML={{ __html: plan.description.replace(/\n/g, '<br />') }} />
              <div className="text-xs text-gray-500">
                <p>Assigned Date: {plan.assigned_date}</p>
                {plan.expiry_date && <p>Expiry Date: {plan.expiry_date}</p>}
                <p>Branch: {plan.branch_name || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}