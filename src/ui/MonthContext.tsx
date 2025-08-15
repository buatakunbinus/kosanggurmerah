import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
} from "react";

interface MonthCtx {
  month: string;
  setMonth: (m: string) => void;
}
const MonthContext = createContext<MonthCtx | undefined>(undefined);

const currentMonth = new Date().toISOString().slice(0, 7);

export const MonthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [month, setMonth] = useState(currentMonth);
  return (
    <MonthContext.Provider value={{ month, setMonth }}>
      {children}
    </MonthContext.Provider>
  );
};

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth must be used within MonthProvider");
  return ctx;
}
