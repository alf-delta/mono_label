export const BREW_METHODS = ['pourover', 'espresso'] as const;

export type BrewMethod = (typeof BREW_METHODS)[number];

export interface ProducerLocation {
  line1: string;
  line2: string;
}

/** Unnormalized application input. Research and Review will eventually produce this shape. */
export interface CoffeeLabelInput {
  coffeeName: string;
  variety: string;
  processing: string;
  altitude: string;
  producer: ProducerLocation;
  tastingNotes: readonly string[];
  brewMethod: BrewMethod;
  backgroundColor: string;
  netWeight?: string;
}

/** Canonical, renderer-facing label data. Raw research data will stay separate. */
export interface CoffeeLabel {
  coffeeName: string;
  variety: string;
  processing: string;
  altitude: string;
  producer: Readonly<ProducerLocation>;
  tastingNotes: readonly string[];
  brewMethod: BrewMethod;
  backgroundColor: string;
  foregroundColor: '#F9F7DE';
  netWeight: string;
}
