import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';

export async function loader({ request, params, context }: LoaderFunctionArgs): Promise<Response> {
  const providerParam = params.provider;

  if (!providerParam) {
    return json({ modelList: [] as ModelInfo[] }, { status: 400, statusText: 'Bad Request' });
  }

  const llmManager = LLMManager.getInstance((context as any)?.cloudflare?.env);

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  const provider = llmManager.getProvider(providerParam);

  if (!provider) {
    return json({ modelList: [] as ModelInfo[] }, { status: 404, statusText: 'Provider Not Found' });
  }

  const modelList = await llmManager.getModelListFromProvider(provider, {
    apiKeys,
    providerSettings,
    serverEnv: (context as any)?.cloudflare?.env as any,
  });

  return json({ modelList });
}
