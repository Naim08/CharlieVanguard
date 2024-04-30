import { AgentOutputType, trimText, ChatMessageBuilder, AgentFunctionResult } from "@/agent-core"
import { ScriptFunction } from "./utils";
import { Agent } from "../agents/utils";

interface UpdateFileFuncParameters {
  path: string;
  content: string;
  startLn: number;
  endLn?: number;
}

export class UpdateFileFunction extends ScriptFunction<UpdateFileFuncParameters> {
  get name() {
    return "fs_updateFile"
  }

  get description() {
    return "Removes the text between [startLn, endLn) in a file and inserts new content at startLn. endLn defaults to the length of the document (in lines). Line numbers are 0-indexed."
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
        content: {
          type: "string"
        },
        startLn: {
          type: "number"
        },
        endLn: {
          type: "number"
        }
      },
      required: ["path", "content", "startLn"],
      additionalProperties: false
    }
  }

  onSuccess(agent: Agent<unknown>, params: UpdateFileFuncParameters, rawParams: string | undefined): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${agent.config.prompts.name}] ${this.name}`,
          content: `File: ${params.path}\n` +
            `Removed lines: [${params.startLn}, ${params.endLn})\n` +
            `Inserted: ${trimText(params.content, 200)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, "Successfully updated file.")
      ]
    }
  }
}