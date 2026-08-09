import { FixtureResearchProvider } from './fixture-provider.js';
import { OpenAIResearchProvider } from './openai-provider.js';
import { ResearchService } from './research-service.js';

export function createResearchService(env: Record<string, string | undefined>): ResearchService {
  const provider = env.RESEARCH_PROVIDER === 'fixture'
    ? new FixtureResearchProvider()
    : new OpenAIResearchProvider(
      env.OPENAI_API_KEY,
      env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-sol',
      env.OPENAI_CREATIVE_MODEL || 'gpt-5.6-terra',
    );
  return new ResearchService(provider);
}
