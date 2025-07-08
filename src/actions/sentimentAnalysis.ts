import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { sentimentAnalysis } from '../utils/sentimentAnalysis';
import { ActionContext } from '../types';

export const sentimentAnalysisAction: Action = {
  name: 'SENTIMENT_ANALYSIS',
  description: 'Analyzes sentiment for a token using Twitter.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    // Ensure message.content is cast to ActionContext
    const content = message.content as ActionContext;
    const result = await sentimentAnalysis(content);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
};