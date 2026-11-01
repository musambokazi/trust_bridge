import React, { createContext, useContext, useState } from "react";
import {
  initialAssessments,
  previewAssessment,
  type Assessment,
  type InvoiceInput,
} from "../domain/demo";
type Demo = {
  assessments: Assessment[];
  check: (input: InvoiceInput) => string;
  reset: () => void;
  name: string;
  setName: (name: string) => void;
  scale: number;
  setScale: (scale: number) => void;
};
const Context = createContext<Demo | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [name, setName] = useState("Thulane");
  const [scale, setScale] = useState(1);
  function check(input: InvoiceInput) {
    const id = `preview-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const result = previewAssessment(input, id, new Date().toISOString());
    setAssessments((a) => [result, ...a]);
    return id;
  }
  return (
    <Context.Provider
      value={{
        assessments,
        check,
        reset: () => setAssessments(initialAssessments),
        name,
        setName,
        scale,
        setScale,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const v = useContext(Context);
  if (!v) throw Error("Missing DemoProvider");
  return v;
}
