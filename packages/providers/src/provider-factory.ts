import type { ProviderPort } from '@legacy-squad/core';
import { MockProvider } from './mock-provider.js';

const PROVIDERS: Record<string, () => ProviderPort> = {
  mock: () => new MockProvider(),
};

/** Open/Closed: register new providers without modifying existing code */
export function registerProvider(name: string, factory: () => ProviderPort): void {
  PROVIDERS[name] = factory;
}

export function createProvider(name: string): ProviderPort {
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown provider: ${name}. Available: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return factory();
}
