import type { StreamFn } from "@mariozechner/pi-agent-core";
import { streamSimple } from "@mariozechner/pi-ai";
import type { ProviderWrapStreamFnContext } from "openclaw/plugin-sdk/plugin-entry";
import {
  applyAnthropicEphemeralCacheControlMarkers,
  buildCopilotDynamicHeaders,
  hasCopilotVisionInput,
  streamWithPayloadPatch,
} from "openclaw/plugin-sdk/provider-stream";

export function wrapCopilotAnthropicStream(baseStreamFn: StreamFn | undefined): StreamFn {
  const underlying = baseStreamFn ?? streamSimple;
  return (model, context, options) => {
    if (model.provider !== "github-copilot") {
      return underlying(model, context, options);
    }

    const nextOptions = {
      ...options,
      headers: {
        ...buildCopilotDynamicHeaders({
          messages: context.messages,
          hasImages: hasCopilotVisionInput(context.messages),
        }),
        ...options?.headers,
      },
    };

    if (model.api !== "anthropic-messages") {
      return underlying(model, context, nextOptions);
    }

    return streamWithPayloadPatch(
      underlying,
      model,
      context,
      nextOptions,
      applyAnthropicEphemeralCacheControlMarkers,
    );
  };
}

export function wrapCopilotProviderStream(ctx: ProviderWrapStreamFnContext): StreamFn {
  return wrapCopilotAnthropicStream(ctx.streamFn);
}
