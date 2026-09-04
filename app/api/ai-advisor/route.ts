import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      question,
      current,
      history,
      weather,
      crop,
      growthStage,
      fieldSize,
    } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are JalBhoomi AI Advisor, an intelligent agricultural
and groundwater monitoring assistant.

Your job is to analyze the farmer's actual JalBhoomi data
and give practical, easy-to-understand recommendations.

IMPORTANT:
- Do not invent sensor readings.
- Use the supplied current and historical data.
- Compare current readings with historical readings.
- Identify trends when possible.
- Consider rainfall and weather.
- Consider crop and growth stage.
- Explain WHY you are making a recommendation.
- If data is insufficient, clearly say so.
- Do not claim that your recommendation is a guaranteed
  prediction.
- Keep the answer concise and farmer-friendly.

CURRENT SENSOR DATA:
${JSON.stringify(current, null, 2)}

HISTORICAL SENSOR DATA:
${JSON.stringify(history, null, 2)}

WEATHER DATA:
${JSON.stringify(weather, null, 2)}

CROP:
${crop}

GROWTH STAGE:
${growthStage}

FIELD SIZE:
${fieldSize} acres

FARMER QUESTION:
${question}

Analyze all relevant information and answer the farmer.
`;

    const response = await fetch(
      "",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: ``,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are JalBhoomi AI Advisor.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "AI request failed",
        },
        { status: 500 }
      );
    }

    const answer =
      data?.choices?.[0]?.message?.content;

    if (!answer) {
      return NextResponse.json(
        { error: "No AI response received" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      answer,
    });

  } catch (error) {
    console.error("AI Advisor error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate AI response",
      },
      { status: 500 }
    );
  }
}