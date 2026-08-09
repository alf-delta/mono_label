# Structured research boundary

Milestone 6 keeps raw evidence separate from normalized label data. Every researched field carries `value`, `confidence`, and verified source URLs. Unknown facts remain `null`; the client never asks the model to construct rendered strings or geometry.

The OpenAI provider lives under `server/research`. The browser calls only `/api/research`, so `OPENAI_API_KEY` is never bundled into client code. A deterministic fixture provider exists for local workflow testing and is visibly identified as a fixture.
