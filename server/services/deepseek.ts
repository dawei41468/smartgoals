import OpenAI from "openai";
import { type AIBreakdownRequest, type AIBreakdownResponse } from "@shared/schema";

// Using Deepseek's API which provides OpenAI-compatible endpoints
const deepseek = new OpenAI({ 
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

export async function generateGoalBreakdown(goalData: AIBreakdownRequest): Promise<AIBreakdownResponse> {
  try {
    // Calculate the number of weeks between now and deadline
    const deadlineDate = new Date(goalData.deadline);
    const startDate = new Date();
    const timeDiff = deadlineDate.getTime() - startDate.getTime();
    const totalWeeks = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));

    const prompt = `
You are an expert goal coach and project manager. Break down the following SMART(ER) goal into a detailed weekly plan with daily tasks.

GOAL DETAILS:
- Specific: ${goalData.specific}
- Measurable: ${goalData.measurable}
- Achievable: ${goalData.achievable}
- Relevant: ${goalData.relevant}
- Time-bound: ${goalData.timebound}
- Exciting: ${goalData.exciting}
- Deadline: ${goalData.deadline}
- Total weeks available: ${totalWeeks}

Please create a breakdown with the following structure:
1. Divide the goal into logical weekly milestones (use all ${totalWeeks} weeks)
2. For each week, provide 3-7 specific daily tasks
3. Each task should be actionable, measurable, and realistic
4. Assign appropriate priority levels (low, medium, high)
5. Estimate time required for each task (1-8 hours)
6. Ensure tasks build upon each other progressively

Return the response in this exact JSON format:
{
  "weeklyGoals": [
    {
      "title": "Week title",
      "description": "What will be accomplished this week",
      "weekNumber": 1,
      "tasks": [
        {
          "title": "Specific task title",
          "description": "Detailed task description",
          "day": 1,
          "priority": "medium",
          "estimatedHours": 2
        }
      ]
    }
  ]
}

Make sure the breakdown is realistic, actionable, and directly aligned with achieving the specified goal by the deadline.
`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert goal coach and project manager. Provide detailed, actionable goal breakdowns in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate the response structure
    if (!result.weeklyGoals || !Array.isArray(result.weeklyGoals)) {
      throw new Error("Invalid response format from Deepseek");
    }

    return result as AIBreakdownResponse;
  } catch (error) {
    console.error("Error generating goal breakdown:", error);
    throw new Error("Failed to generate goal breakdown: " + (error as Error).message);
  }
}

export async function regenerateGoalBreakdown(goalData: AIBreakdownRequest, feedback?: string): Promise<AIBreakdownResponse> {
  try {
    const deadlineDate = new Date(goalData.deadline);
    const startDate = new Date();
    const timeDiff = deadlineDate.getTime() - startDate.getTime();
    const totalWeeks = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));

    const prompt = `
You are an expert goal coach and project manager. I need you to regenerate a breakdown for this SMART(ER) goal with improvements.

GOAL DETAILS:
- Specific: ${goalData.specific}
- Measurable: ${goalData.measurable}
- Achievable: ${goalData.achievable}
- Relevant: ${goalData.relevant}
- Time-bound: ${goalData.timebound}
- Exciting: ${goalData.exciting}
- Deadline: ${goalData.deadline}
- Total weeks available: ${totalWeeks}

${feedback ? `USER FEEDBACK: ${feedback}` : "Please provide a different approach with alternative task sequencing and timing."}

Create an improved breakdown that addresses any feedback and provides a fresh perspective on achieving this goal.

Return the response in this exact JSON format:
{
  "weeklyGoals": [
    {
      "title": "Week title",
      "description": "What will be accomplished this week",
      "weekNumber": 1,
      "tasks": [
        {
          "title": "Specific task title",
          "description": "Detailed task description",
          "day": 1,
          "priority": "medium",
          "estimatedHours": 2
        }
      ]
    }
  ]
}
`;

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are an expert goal coach and project manager. Provide detailed, actionable goal breakdowns in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 4000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.weeklyGoals || !Array.isArray(result.weeklyGoals)) {
      throw new Error("Invalid response format from Deepseek");
    }

    return result as AIBreakdownResponse;
  } catch (error) {
    console.error("Error regenerating goal breakdown:", error);
    throw new Error("Failed to regenerate goal breakdown: " + (error as Error).message);
  }
}
