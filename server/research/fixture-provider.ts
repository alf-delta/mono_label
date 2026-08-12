import type { ResearchProvider, ResearchProviderResult } from './provider-types.js';
import type { LabelConceptRequest } from '../../src/concept/concept-types.js';
import type { RawLabelConcept } from '../../src/concept/concept-schema.js';
import type { CoffeeDiscoveryRequest } from '../../src/discovery/discovery-types.js';
import type { ResearchRequest } from '../../src/research/research-types.js';

const FIXTURE_SOURCE = 'https://example.invalid/monoblend-research-fixture';

export class FixtureResearchProvider implements ResearchProvider {
  readonly name = 'fixture' as const;
  readonly configured = true;

  async discover(request: CoffeeDiscoveryRequest) {
    return {
      model: 'deterministic-discovery-fixture-v1',
      sources: [{ url: FIXTURE_SOURCE, title: 'Local deterministic discovery fixture' }],
      raw: {
        canonicalVariety: request.variety.trim(),
        summary: 'Verified fixture coffees grouped by origin for local workflow testing.',
        candidates: [
          {
            coffeeName: 'King Arthur Geisha',
            variety: 'Geisha',
            producer: 'Elkin Arcila',
            farm: 'Finca Puerto Arturo',
            country: 'Colombia',
            region: 'Támesis, Antioquia',
            processing: 'Washed',
            harvest: '2022',
            sourceUrl: FIXTURE_SOURCE,
          },
        ],
      },
    };
  }

  async research(request: ResearchRequest): Promise<ResearchProviderResult> {
    const sourced = <T>(value: T) => ({ value, confidence: 'medium' as const, sources: [FIXTURE_SOURCE] });
    return {
      model: 'deterministic-fixture-v1',
      sources: [{ url: FIXTURE_SOURCE, title: 'Local deterministic research fixture' }],
      raw: {
        coffeeName: sourced(request.coffeeName),
        variety: sourced(request.variety ?? 'Geisha'),
        processing: sourced('Honey'),
        altitude: sourced('1800'),
        producer: sourced({ line1: 'Colombia', line2: 'Támesis' }),
        tastingNotes: sourced(['tangerine', 'peach', 'jasmine', 'honey']),
        brewMethod: sourced('pourover'),
        summary: 'Deterministic fixture for testing the research workflow without an external request.',
      },
    };
  }

  async createLabelConcept(request: LabelConceptRequest): Promise<{ raw: RawLabelConcept; model: string }> {
    const variety = request.research.variety.value ?? 'Geisha';
    return {
      model: 'deterministic-color-fixture-v1',
      raw: {
        recommended: {
          name: 'Geisha Bloom',
          requestedHex: '#7A4C5A',
          story: 'A deep mulberry shaped by Geisha florals, jasmine clarity and the honey sweetness of this lot.',
          anchors: [
            { field: 'variety', value: variety },
            { field: 'tastingNote', value: 'jasmine' },
            { field: 'processing', value: 'Honey' },
          ],
        },
        alternatives: [
          {
            name: 'Tangerine Silk',
            requestedHex: '#7A4235',
            story: 'A burnished citrus tone connecting the Geisha variety with this coffee’s tangerine brightness.',
            anchors: [
              { field: 'variety', value: variety },
              { field: 'tastingNote', value: 'tangerine' },
            ],
          },
          {
            name: 'Jasmine Canopy',
            requestedHex: '#3F5B4B',
            story: 'A botanical green that pairs the elegance of Geisha with the lot’s jasmine character.',
            anchors: [
              { field: 'variety', value: variety },
              { field: 'tastingNote', value: 'jasmine' },
            ],
          },
          {
            name: 'Támesis Blue',
            requestedHex: '#40556C',
            story: 'A cool blue connecting the clarity of the Geisha variety with this lot’s origin in Támesis.',
            anchors: [
              { field: 'variety', value: variety },
              { field: 'origin', value: 'Támesis' },
            ],
          },
        ],
      },
    };
  }
}
