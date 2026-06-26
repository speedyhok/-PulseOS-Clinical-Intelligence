import { useState } from "react";
import { Bot, Calendar, Microscope, Send, Sparkles, Stethoscope, TrendingUp } from "lucide-react";
import type { ChatMessage, PatientDigitalTwin } from "../lib/types";

interface Props {
  twin: PatientDigitalTwin;
  chatHistory: ChatMessage[];
  onSend: (message: string) => void;
}

const QUICK_PROMPTS = [
  {
    label: "Doctor Brief",
    icon: Stethoscope,
    prompt:
      "I have an upcoming appointment. Please act as the Doctor Preparation Agent and generate a brief of customized clinical questions I should ask my primary care provider based on my longitudinal trends.",
  },
  {
    label: "Liver Trend",
    icon: TrendingUp,
    prompt:
      "Interpret my liver test results. Analyze the trend of ALT values in my history, tell me which agent handles it, and give a patient-friendly summary.",
  },
  {
    label: "PubMed Research",
    icon: Microscope,
    prompt:
      "Search the PubMed database for clinical guidelines on Fatty Liver and Hypertension. What are the Mayo Clinic or ACC recommendations?",
  },
];

export default function ChatPanel({ twin, chatHistory, onSend }: Props) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    setThinking(true);
    onSend(text);
    setInput("");
    setTimeout(() => setThinking(false), 600);
  };

  return (
    <section className="glass-card p-5 md:p-6 flex flex-col h-full">
      <h2 className="card-title">
        <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <Bot className="w-4 h-4 text-teal-600" />
        </span>
        AI Health Assistant
      </h2>

      <details className="mb-3 group">
        <summary className="text-xs text-teal-600 hover:text-teal-700 cursor-pointer flex items-center gap-1.5 list-none font-medium">
          <Calendar className="w-3.5 h-3.5" />
          Longitudinal Health Journey Timeline
          <span className="text-teal-400 group-open:rotate-90 transition-transform">▸</span>
        </summary>
        <div className="mt-3 pl-3.5">
          {twin.history.length > 0 ? (
            [...twin.history]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((rec, i) => (
                <div key={i} className="timeline-item">
                  <p className="text-[0.7rem] text-teal-500 mb-1 font-semibold">
                    {rec.date} — {rec.recordType}
                  </p>
                  <p className="text-xs text-teal-800">
                    <span className="text-teal-400">Labs:</span>{" "}
                    {rec.labs.map((l) => `${l.metric}: ${l.value} ${l.unit}`).join(", ")}
                  </p>
                  <p className="text-xs text-teal-800 mt-0.5">
                    <span className="text-teal-400">Rx:</span>{" "}
                    {rec.medications.length > 0 ? rec.medications.join(", ") : "None"}
                  </p>
                </div>
              ))
          ) : (
            <p className="text-sm text-teal-500/80 italic">Timeline empty. Load a profile to display historic records.</p>
          )}
        </div>
      </details>

      <div className="chat-container">
        {chatHistory.length > 0 ? (
          chatHistory.map((msg, i) => (
            <div key={i} className={`chat-row ${msg.role === "user" ? "user-row" : "agent-row"}`}>
              <div className={`chat-avatar ${msg.role === "user" ? "user-avatar" : "agent-avatar"}`}>
                {msg.role === "user" ? "U" : "AI"}
              </div>
              <div className="chat-bubble whitespace-pre-line">{msg.text}</div>
            </div>
          ))
        ) : (
          <div className="text-teal-500 text-sm text-center my-auto px-4 flex flex-col items-center gap-2">
            <Sparkles className="w-7 h-7 text-teal-400" />
            <p>Ask the coordinator or select a quick clinical action below to begin.</p>
          </div>
        )}
        {thinking && (
          <div className="chat-row agent-row">
            <div className="chat-avatar agent-avatar">AI</div>
            <div className="chat-bubble">
              <span className="typing-dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-teal-600 mb-2 font-medium">Quick Clinical Actions:</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            onClick={() => send(qp.prompt)}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-white/55 border border-teal-200/70 text-teal-700 text-[0.72rem] font-semibold text-center hover:bg-teal-50 hover:border-teal-400 hover:-translate-y-0.5 transition-all"
          >
            <qp.icon className="w-4 h-4 text-teal-500" />
            {qp.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question for the clinical agents..."
          className="input-field flex-1"
        />
        <button type="submit" disabled={!input.trim() || thinking} className="btn-primary !w-11 !px-0">
          <Send className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </form>
    </section>
  );
}
