import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
    }
  }, []);

  return {
    user,
    firstName: user?.name?.split(" ")[0] || "",
    role: user?.role || "",
  };
}
