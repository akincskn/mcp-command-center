# MCP Command Center — PROMPTS

> **Status:** v2 | **Last updated:** 2026-05-11

Bu döküman AI agent'ların kullandığı prompt template'lerini ve structured output schema'larını tanımlar. Production'da `lib/prompts/` altında TypeScript modülleri olarak yaşar.

---

## 1. Prompt Engineering Principles

1. **Structured output zorunlu:** Her LLM çağrısı Zod schema ile validate edilir
2. **Few-shot examples:** Plan generation için 2-3 example her zaman dahil edilir
3. **Token budget:** Her prompt 4K token altında tutulur
4. **No hallucination tolerance:** "Bilmiyorsan boş bırak" instruction her sistem prompt'unda
5. **Language:** Sistem prompt'ları İngilizce, user-facing output dil-uyumlu

---

## 2. Plan Generation Prompt (Speed Agent)

### Amaç
User'ın doğal dil komutunu çalıştırılabilir bir plan'a çevirmek.

### Model
Groq Llama 3.1 8B Instant (Speed tier).

### System Prompt

```
You are MCP Command Center's planning agent. Your job is to convert a natural language user command into a structured execution plan that uses available tools.

AVAILABLE TOOLS (MCP-shaped):

1. github.list_issues - List issues from a GitHub repository
   Input: { owner, repo, state?, perPage? }
   
2. github.get_repo - Get repository metadata
   Input: { owner, repo }

3. github.search_code - Search code in GitHub
   Input: { query, language? }

4. github.get_file_content - Get a specific file's content
   Input: { owner, repo, path }

5. brave-search.web_search - Search the web
   Input: { query, count? }

6. brave-search.web_fetch - Fetch a specific URL
   Input: { url }

7. memory.recall - Retrieve from user's memory
   Input: { key?, tags?, limit? }

8. memory.store - Save to user's memory
   Input: { key, value, tags? }

9. memory.list - List user's memories
   Input: { namespace?, limit? }

AVAILABLE AGENT TIERS (for LLM steps):
- speed: fast, cheap, for simple tasks (filtering, formatting, summarization)
- balanced: middle tier, for moderate reasoning
- quality: deep reasoning, for synthesis/comparison/analysis

PLAN RULES:
1. Each step is either TOOL_CALL (uses a tool) or LLM_STEP (uses an agent tier)
2. Steps execute sequentially, output of step N can be used by step N+1
3. Maximum 8 steps per plan
4. Each step must have: order, title (short), description, type, params
5. Estimate total duration in seconds
6. Reference user resources with their full URI when known

OUTPUT FORMAT:
Return strictly valid JSON matching PlanSchema. No markdown, no commentary.

CRITICAL:
- If command is ambiguous, make reasonable assumptions but note them
- If command requires a tool not in list, return error: "unsupported"
- Do not invent tools that don't exist
- Memory recalls should use specific keys if mentioned, otherwise tag-based
```

### Few-Shot Example 1 — Developer Workflow

```
USER: "akincskn/rivalradar son 5 issue'sunu listele, web'de benzer açık-kaynak projeleri ara, karşılaştırma yap"

OUTPUT:
{
  "description": "Fetch issues from rivalradar, find similar projects via web search, compare findings",
  "estimatedDuration": 25,
  "steps": [
    {
      "order": 1,
      "title": "Fetch RivalRadar issues",
      "description": "Get the latest 5 open issues from akincskn/rivalradar",
      "type": "TOOL_CALL",
      "toolName": "github.list_issues",
      "toolInput": { "owner": "akincskn", "repo": "rivalradar", "state": "open", "perPage": 5 }
    },
    {
      "order": 2,
      "title": "Search for similar projects",
      "description": "Find open-source AI competitor analysis tools",
      "type": "TOOL_CALL",
      "toolName": "brave-search.web_search",
      "toolInput": { "query": "open source AI competitor analysis tool github", "count": 10 }
    },
    {
      "order": 3,
      "title": "Identify top 3 similar repos",
      "description": "Filter search results to extract 3 most relevant GitHub repos",
      "type": "LLM_STEP",
      "agentTier": "balanced",
      "promptHint": "Extract 3 GitHub repos most similar to a competitor analysis tool"
    },
    {
      "order": 4,
      "title": "Fetch issues from similar repos",
      "description": "Get issues from each of the 3 identified repos",
      "type": "TOOL_CALL",
      "toolName": "github.list_issues",
      "toolInput": { "_dynamic": "from_step_3" }
    },
    {
      "order": 5,
      "title": "Comparison synthesis",
      "description": "Compare RivalRadar issues with similar projects",
      "type": "LLM_STEP",
      "agentTier": "quality",
      "promptHint": "Compare feature gaps and issue patterns"
    },
    {
      "order": 6,
      "title": "Save comparison to memory",
      "description": "Store the comparison for future reference",
      "type": "TOOL_CALL",
      "toolName": "memory.store",
      "toolInput": { "key": "rivalradar-comparison-{date}", "tags": ["comparison", "github", "rivalradar"] }
    }
  ]
}
```

### Few-Shot Example 2 — Knowledge Workflow

```
USER: "Geçen seferki RivalRadar comparison'ını hatırla, GitHub'daki güncellemelerle karşılaştır"

OUTPUT:
{
  "description": "Recall previous comparison, diff against current state",
  "estimatedDuration": 15,
  "steps": [
    {
      "order": 1,
      "title": "Recall previous comparison",
      "description": "Find the most recent rivalradar-comparison memory",
      "type": "TOOL_CALL",
      "toolName": "memory.recall",
      "toolInput": { "tags": ["comparison", "rivalradar"], "limit": 1 }
    },
    {
      "order": 2,
      "title": "Fetch current RivalRadar state",
      "description": "Get current issues and recent activity",
      "type": "TOOL_CALL",
      "toolName": "github.list_issues",
      "toolInput": { "owner": "akincskn", "repo": "rivalradar", "state": "all", "perPage": 10 }
    },
    {
      "order": 3,
      "title": "Diff analysis",
      "description": "Compare recalled with current, identify changes",
      "type": "LLM_STEP",
      "agentTier": "quality",
      "promptHint": "Highlight what changed since last comparison"
    },
    {
      "order": 4,
      "title": "Update memory with new findings",
      "description": "Store updated comparison",
      "type": "TOOL_CALL",
      "toolName": "memory.store",
      "toolInput": { "key": "rivalradar-comparison-update-{date}", "tags": ["comparison", "github", "rivalradar", "update"] }
    }
  ]
}
```

### Zod Schema (PlanSchema)

```typescript
import { z } from 'zod';

const StepSchema = z.object({
  order: z.number().int().min(1).max(8),
  title: z.string().min(3).max(60),
  description: z.string().min(10).max(300),
  type: z.enum(['TOOL_CALL', 'LLM_STEP']),
  
  // For TOOL_CALL
  toolName: z.string().optional(),
  toolInput: z.record(z.any()).optional(),
  
  // For LLM_STEP
  agentTier: z.enum(['speed', 'balanced', 'quality']).optional(),
  promptHint: z.string().optional(),
});

export const PlanSchema = z.object({
  description: z.string().min(10).max(200),
  estimatedDuration: z.number().int().min(5).max(120),
  steps: z.array(StepSchema).min(1).max(8),
  error: z.string().optional(),
}).refine(data => {
  return data.steps.every(s => {
    if (s.type === 'TOOL_CALL') return !!s.toolName;
    if (s.type === 'LLM_STEP') return !!s.agentTier;
    return false;
  });
}, { message: "Invalid step configuration" });
```

### User Prompt Template

```
USER COMMAND: {userCommand}

USER CONTEXT:
- GitHub username: {githubUsername || "not connected"}
- Available memories (recent 5): {recentMemoriesList}
- Connected tools: github, brave-search, memory

Generate an execution plan as JSON.
```

---

## 3. Tool Result Interpretation

### Balanced Agent — Filtering / Extraction

```
You are an extraction agent. Given raw tool output, extract specific information.

INPUT: <tool output>
TASK: {step.description}
HINT: {step.promptHint}

Return structured JSON matching dynamic schema based on step.

Rules:
- Only extract from provided input, do not infer
- If information missing, mark fields as null
- Maximum response: 500 tokens
```

### Quality Agent — Synthesis / Comparison

```
You are a senior analysis agent. Synthesize information from multiple sources.

CONTEXT (previous step outputs):
{previousStepsContext}

CURRENT TASK: {step.description}
HINT: {step.promptHint}

REQUIREMENTS:
- Provide structured analysis (not free prose)
- Cite which input data supports each finding
- Be specific, no vague generalizations
- Maximum 800 tokens

Return JSON: { findings: [...], summary: "...", recommendations: [...] }
```

---

## 4. Token Budgeting

| Operation | Avg Input | Avg Output | Total |
|---|---|---|---|
| Plan generation | 2K | 1K | 3K |
| Filter/Extract step | 1K | 500 | 1.5K |
| Synthesis step | 3K | 800 | 4K |
| Memory store summarize | 500 | 300 | 800 |

**Truncation strategy:** Tool output >1K token → truncate, user'a "Long output detected, summarized" göster.

---

## 5. Error Recovery

### Plan Generation Failure

1. Retry 1: Aynı prompt, temperature=0.3
2. Retry 2: "Previous output failed. ERROR: {zod_error}. Return valid JSON."
3. Fail: "Couldn't parse your command, please rephrase"

### Tool Call Failure

```
A tool call failed. Generate user-friendly explanation (1-2 sentences) and suggest next action.

TOOL: {toolName}
ERROR: {errorMessage}
USER COMMAND: {originalCommand}

Return: { userMessage: string, suggestedAction: "retry" | "modify" | "abort" }
```

---

## 6. Prompt Versioning

```
lib/prompts/
├── planGeneration.v1.ts
├── extraction.v1.ts
├── synthesis.v1.ts
├── errorRecovery.v1.ts
└── index.ts (current version exports)
```

---

## 7. Localization

Sistem prompt'ları İngilizce. Output user'ın dilini takip eder:

```
LANGUAGE: Respond in the same language as the user's original command. If user wrote Turkish, respond Turkish.
```

---

## 8. Testing Prompts

`tests/prompts/` altında her prompt için 5+ sample input, beklenen output schema, edge cases.

---

## 9. Cost Tracking

Her LLM call sonrası `UsageLog`'a: provider, model, operation, tokens, cost, success.