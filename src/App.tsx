import { useMemo, useState } from "react";
import Header from "./components/Header";
import LabPanel from "./components/LabPanel";
import AnatomyPanel from "./components/AnatomyPanel";
import ChatPanel from "./components/ChatPanel";
import { DEMO_PATIENT, EMPTY_PATIENT } from "./lib/demoData";
import { generateAgentResponse, getOrganStatuses } from "./lib/clinical";
import type { ChatMessage, LabResult, PatientDigitalTwin } from "./lib/types";

export default function App() {
  const [twin, setTwin] = useState<PatientDigitalTwin>(EMPTY_PATIENT);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const organStatuses = useMemo(() => getOrganStatuses(twin), [twin]);

  const loadDemo = () => {
    setTwin(DEMO_PATIENT);
    setChatHistory([]);
  };

  const reset = () => {
    setTwin(EMPTY_PATIENT);
    setChatHistory([]);
  };

  const addLabs = (labs: LabResult[]) => {
    setTwin((prev) => {
      const today = new Date().toISOString().slice(0, 10);
      const newRecord = {
        date: today,
        recordType: "Blood Test",
        labs,
        medications: [],
      };
      return { ...prev, history: [...prev.history, newRecord] };
    });
  };

  const sendMessage = (text: string) => {
    const userMsg: ChatMessage = { role: "user", text };
    const agentReply = generateAgentResponse(text, twin);
    setChatHistory((prev) => [...prev, userMsg, { role: "agent", text: agentReply }]);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <Header twin={twin} onLoadDemo={loadDemo} onReset={reset} />

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_1.2fr] gap-5 items-stretch">
          <LabPanel twin={twin} onAddLabs={addLabs} />
          <AnatomyPanel statuses={organStatuses} />
          <ChatPanel twin={twin} chatHistory={chatHistory} onSend={sendMessage} />
        </div>

        <footer className="mt-8 pt-4 border-t border-teal-200/50 text-center text-xs text-teal-500">
          PulseOS patient platform uses NIH RxNorm &amp; PubMed MCP Server connections. For informational purposes only.
        </footer>
      </div>
    </div>
  );
}
