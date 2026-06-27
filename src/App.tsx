/**
 * Author: Mohibul Hoque
 * Email: hokworks@gmail.com
 * LinkedIn: linkedin.com/in/speedymohibul
 */
import { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import LabPanel from "./components/LabPanel";
import AnatomyPanel from "./components/AnatomyPanel";
import ChatPanel from "./components/ChatPanel";
import { EMPTY_PATIENT } from "./lib/demoData";
import { getOrganStatuses } from "./lib/clinical";
import type { ChatMessage, LabResult, PatientDigitalTwin } from "./lib/types";
import { API_BASE_URL } from "./config";

export default function App() {
  const [twin, setTwin] = useState<PatientDigitalTwin>(EMPTY_PATIENT);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [sessionId] = useState<string>(() => {
    const id = sessionStorage.getItem("pulseos_session_id") || crypto.randomUUID();
    sessionStorage.setItem("pulseos_session_id", id);
    return id;
  });

  const organStatuses = useMemo(() => getOrganStatuses(twin), [twin]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/patient?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => setTwin(data))
      .catch((err) => console.error("Error loading patient digital twin:", err));
  }, [sessionId]);

  const loadDemo = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/patient/load_demo?session_id=${sessionId}`, { method: "POST" });
      const res = await fetch(`${API_BASE_URL}/api/patient?session_id=${sessionId}`);
      const data = await res.json();
      setTwin(data);
      setChatHistory([]);
    } catch (err) {
      console.error("Error loading demo:", err);
    }
  };

  const reset = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/patient/reset?session_id=${sessionId}`, { method: "POST" });
      const res = await fetch(`${API_BASE_URL}/api/patient?session_id=${sessionId}`);
      const data = await res.json();
      setTwin(data);
      setChatHistory([]);
    } catch (err) {
      console.error("Error resetting:", err);
    }
  };

  const addLabs = async (labs: LabResult[], medications?: string[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/labs/add?session_id=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labs, medications }),
      });
      const data = await res.json();
      setTwin(data);
    } catch (err) {
      console.error("Error adding labs:", err);
    }
  };

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", text };
    setChatHistory((prev) => [...prev, userMsg]);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat?session_id=${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setChatHistory((prev) => [...prev, { role: "agent", text: data.response }]);

      const twinRes = await fetch(`${API_BASE_URL}/api/patient?session_id=${sessionId}`);
      const updatedTwin = await twinRes.json();
      setTwin(updatedTwin);
    } catch (e) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "agent",
          text: `Error communicating with clinical agents: ${e instanceof Error ? e.message : e}. (Ensure GCP credentials or environment variables are configured correctly for LLM calls).`,
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <Header twin={twin} onLoadDemo={loadDemo} onReset={reset} />

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_1.2fr] gap-5 items-stretch">
          <LabPanel twin={twin} onAddLabs={addLabs} sessionId={sessionId} />
          <AnatomyPanel statuses={organStatuses} />
          <ChatPanel twin={twin} chatHistory={chatHistory} onSend={sendMessage} />
        </div>

        <footer className="mt-8 pt-4 border-t border-teal-200/50 text-center text-xs text-teal-500">
          <div className="mb-2">
            PulseOS patient platform uses NIH RxNorm &amp; PubMed MCP Server connections. For informational purposes only.
          </div>
          <div className="text-teal-600 font-semibold">
            Developed by <span className="font-extrabold text-teal-700">Mohibul Hoque</span> | <a href="mailto:hokworks@gmail.com" className="underline hover:text-teal-800">hokworks@gmail.com</a> | <a href="https://linkedin.com/in/speedymohibul" target="_blank" rel="noopener noreferrer" className="underline hover:text-teal-800">LinkedIn Profile</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
