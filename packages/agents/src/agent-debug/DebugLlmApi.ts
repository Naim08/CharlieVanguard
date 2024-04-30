import { ChatCompletionMessage } from "openai/resources";
import { DebugLog } from "./DebugLog";
import { Timer } from "./Timer";

import { LlmApi, LlmOptions, ChatLogs, LlmModel } from "@/agent-core";

export class DebugLlmApi implements LlmApi {
  constructor(
    public debugLog: DebugLog,
    public llm: LlmApi,
  ) { }

  getMaxContextTokens(): number {
    return this.llm.getMaxContextTokens();
  }

  getMaxResponseTokens(): number {
    return this.llm.getMaxResponseTokens();
  }

  getModel(): LlmModel {
    return this.llm.getModel();
  }

  async getResponse(
    chatLogs: ChatLogs,
    functionDefinitions: any[],
    options?: LlmOptions | undefined
  ): Promise<ChatCompletionMessage | undefined> {
    const time = new Timer();
    time.start();

    const resp = await this.llm.getResponse(
      chatLogs,
      functionDefinitions,
      options
    );

    time.end();
    await this.debugLog.stepLlmReq(time, chatLogs.clone(), resp);

    return resp;
  }
}
