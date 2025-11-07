import type { ContextSnapshot } from '@/lib/context/types';

export interface BuildPromptOptions {
  tokenLimit?: number;
}

export class ContextEngine {
  private tokenLimit: number;

  constructor(options?: BuildPromptOptions) {
    this.tokenLimit = options?.tokenLimit ?? 1500;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  trimToLimit(chunks: string[]): string[] {
    const kept: string[] = [];
    let usedTokens = 0;

    for (const chunk of chunks) {
      const estimated = this.estimateTokens(chunk);
      if (usedTokens + estimated > this.tokenLimit) {
        break;
      }
      kept.push(chunk);
      usedTokens += estimated;
    }

    return kept;
  }

  buildPrompt(userInput: string, snapshots: ContextSnapshot[]): {
    prompt: string;
    included: ContextSnapshot[];
  } {
    const parts: string[] = [];
    const included: ContextSnapshot[] = [];
    const ordered = snapshots.sort((a, b) => {
      const ta = 'timestamp' in a ? a.timestamp : 0;
      const tb = 'timestamp' in b ? b.timestamp : 0;
      return tb - ta;
    });

    for (const snapshot of ordered) {
      let chunk = '';
      if (snapshot.type === 'selection') {
        const nodeText = snapshot.nodes
          .map((node) => node.text)
          .filter(Boolean)
          .join(', ');
        if (!nodeText.trim().length) continue;
        chunk = `选区节点：${nodeText}`;
      } else if (snapshot.type === 'project') {
        chunk = `项目 ${snapshot.title}: ${snapshot.summary ?? ''}`;
      } else if (snapshot.type === 'conversation') {
        const lastMessage = snapshot.messages.at(-1);
        if (!lastMessage) continue;
        chunk = `最近对话(${lastMessage.role}): ${lastMessage.content}`;
      }

      if (!chunk.length) continue;
      parts.push(chunk);
      included.push(snapshot);
    }

    const trimmedParts = this.trimToLimit(parts);
    const keptSnapshots = included.slice(0, trimmedParts.length);

    const prompt = `用户输入：${userInput}\n\n上下文：\n${trimmedParts.join('\n')}`;
    return { prompt, included: keptSnapshots };
  }
}
