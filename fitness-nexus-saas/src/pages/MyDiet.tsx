import { useEffect, useState } from "react";
import axios from "axios";

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

export default function MyDiet() {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMyDietPlans = async () => {
      try {
        const res = await axios.get("http://localhost:8000/users/my-diet-plans", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDietPlans(res.data);
      } catch (err: any) {
        console.error("Failed to fetch diet plans:", err);
        setError(`Failed to load diet plans: ${err.response?.data?.detail || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDietPlans();
  }, [token]);

  if (loading) {
    return <div className="p-6 text-center">Loading diet plans...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      <h2 className="text-3xl font-boldd text-gray-800 mb-6 text-left text-logoOrange">My Diet Plans</h2>
      {dietPlans.length === 0 ? (
        <p className="text-gray-600 text-center text-lg text-logoOrange">No diet plans assigned to you yet. Check back later!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dietPlans.map(plan => (
            <div
              key={plan.id}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100
                         transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                         flex flex-col justify-between"
            >
              <div>
                {/* Changed text-primary to text-logoOrange */}
                <h3 className="text-2xl font-boldd text-logoOrange mb-3 leading-tight">{plan.title}</h3>
                <p className="text-sm text-gray-500 mb-4 border-b pb-3 border-gray-100">
                  Assigned by: <span className="font-semibold text-gray-700">{plan.assigned_by_trainer?.name || 'N/A'}</span> (<span className="text-gray-500">{plan.assigned_by_trainer?.email || 'N/A'}</span>)
                </p>
                <div
                  className="prose prose-sm max-w-none mb-4 text-gray-700 leading-relaxed overflow-y-auto max-h-40 custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: plan.description.replace(/\n/g, '<br />') }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                <p className="mb-1"><strong>Assigned Date:</strong> {new Date(plan.assigned_date).toLocaleDateString("en-GB")}</p>
                {plan.expiry_date && <p className="mb-1"><strong>Expiry Date:</strong> {new Date(plan.expiry_date).toLocaleDateString("en-GB")}</p>}
                <p><strong>Branch:</strong> {plan.branch_name || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}