import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId parameter is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.COMET_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "COMET_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Используем правильный endpoint согласно документации
    const endpoint = `https://api.cometapi.com/mj/task/${taskId}/fetch`;
    console.log("Using correct endpoint:", endpoint);

    try {
      console.log("Fetching task from correct endpoint:", endpoint);
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Successfully fetched task data:", data);
        
        // Проверяем различные возможные структуры ответа
        const resultData = data.result || data;
        console.log("Result data:", resultData);
        
        return NextResponse.json(data);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch task:", response.status, errorText);
        return NextResponse.json(
          { error: `Failed to fetch task: ${response.status}`, details: errorText },
          { status: response.status }
        );
      }
    } catch (e) {
      console.error("Error fetching task:", e);
      return NextResponse.json(
        { error: "Error fetching task", details: String(e) },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Midjourney task query error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}