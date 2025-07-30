import { useEffect, useState } from "react";
import axios from "axios";

interface Fee {
  id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  assigned_by_name: string;
  branch_name: string;
}

export default function Fees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:8000/fees/my-fees", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setFees(res.data))
      .catch(() => alert("Failed to load fees"));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Fees</h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Due Date</th>
            <th className="p-2">Status</th>
            <th className="p-2">Assigned By</th>
          </tr>
        </thead>
        <tbody>
          {fees.map(f => (
            <tr key={f.id} className="text-center border-t">
              <td>{f.fee_type}</td>
              <td>₹{f.amount}</td>
              <td>{f.due_date}</td>
              <td>{f.is_paid ? "Paid" : "Unpaid"}</td>
              <td>{f.assigned_by_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
