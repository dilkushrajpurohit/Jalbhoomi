"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAdvisor() {
  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm JalBhoomi AI Advisor. Ask me about your groundwater, irrigation, borewell, crop, or water quality.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();

    // Show user's question immediately
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: userQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      /*
       * DEMO DATA
       *
       * Later this will come directly from
       * Supabase / PostDrilling history.
       */

      const current = {
        waterLevel: 42.6,
        flowRate: 18.4,
        salinity: 1.72,
        soilMoisture: 34,
        pumpOn: false,
      };

      const history = [
        {
          time: "06:00",
          waterLevel: 40.8,
          flowRate: 0,
          soilMoisture: 31,
        },
        {
          time: "08:00",
          waterLevel: 41.2,
          flowRate: 12.5,
          soilMoisture: 32,
        },
        {
          time: "10:00",
          waterLevel: 42.1,
          flowRate: 17.8,
          soilMoisture: 33,
        },
        {
          time: "12:00",
          waterLevel: 42.8,
          flowRate: 19.1,
          soilMoisture: 35,
        },
        {
          time: "14:00",
          waterLevel: 42.6,
          flowRate: 18.4,
          soilMoisture: 34,
        },
      ];

      const weather = {
        rainfall: 2,
        temperature: 31,
      };

      const response = await fetch("/api/ai-advisor", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: userQuestion,

          current,

          history,

          weather,

          crop: "Wheat",

          growthStage: "Vegetative",

          fieldSize: 2,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "AI request failed"
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      console.error("AI error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "❌ Sorry, I couldn't analyze the data right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      {/* HEADER */}
      <header className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">
          🤖 AI Advisor
        </h1>

        <p className="mt-2 text-gray-500">
          Get intelligent recommendations for groundwater
          and irrigation.
        </p>

      </header>

      {/* AI CARD */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-semibold text-gray-900">
          JalBhoomi AI
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          AI analyzes current conditions and historical
          groundwater data.
        </p>

        {/* CHAT */}
        <div className="mt-6 h-[450px] overflow-y-auto rounded-lg bg-gray-50 p-5">

          {messages.map((message, index) => (

            <div
              key={index}
              className={`mb-4 flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 shadow-sm"
                }`}
              >

                <p className="whitespace-pre-line">
                  {message.content}
                </p>

              </div>

            </div>

          ))}

          {/* LOADING */}
          {loading && (
            <div className="mb-4 flex justify-start">

              <div className="rounded-xl bg-white px-4 py-3 text-gray-500 shadow-sm">

                🤖 Analyzing your JalBhoomi data...

              </div>

            </div>
          )}

        </div>

        {/* INPUT */}
        <div className="mt-5 flex gap-3">

          <input
            type="text"
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                askAI();
              }
            }}
            placeholder="Ask JalBhoomi AI..."
            disabled={loading}
            className="flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />

          <button
            onClick={askAI}
            disabled={loading || !question.trim()}
            className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Ask"}
          </button>

        </div>

      </section>

      {/* QUICK QUESTIONS */}
      <section className="mt-6">

        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Quick questions
        </h3>

        <div className="flex flex-wrap gap-3">

          {[
            "Should I irrigate my crop now?",
            "How is my borewell performing?",
            "Is my groundwater level safe?",
            "What is my current water quality?",
            "What does my groundwater trend indicate?",
          ].map((item) => (

            <button
              key={item}
              onClick={() => setQuestion(item)}
              className="rounded-full border bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              {item}
            </button>

          ))}

        </div>

      </section>

    </main>
  );
}