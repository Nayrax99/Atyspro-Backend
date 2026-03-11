/**
 * Fournisseurs LLM pour l'agent vocal
 * Swappable via la variable d'env LLM_PROVIDER
 */

import Anthropic from "@anthropic-ai/sdk";

/** Interface commune pour tous les fournisseurs LLM */
export interface LLMProvider {
  complete(systemPrompt: string, userMessage: string): Promise<string>;
}

/** Implémentation Anthropic (défaut) — Claude Sonnet */
export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content[0];
    if (block.type !== "text") {
      throw new Error("Réponse LLM inattendue : type non-text");
    }
    return block.text;
  }
}

/** Implémentation OpenAI (squelette — à implémenter si besoin de swap) */
export class OpenAIProvider implements LLMProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    throw new Error(
      "OpenAI provider non implémenté — installe le package openai et ajoute OPENAI_API_KEY"
    );
  }
}

/** Retourne le fournisseur LLM selon la variable d'env LLM_PROVIDER */
export function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || "anthropic";
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider();
    case "openai":
      return new OpenAIProvider();
    default:
      throw new Error(`Fournisseur LLM inconnu : ${provider}`);
  }
}
