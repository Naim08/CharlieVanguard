import {
  Args_ask,
  Args_onGoalAchieved,
  Args_onGoalFailed,
  Args_speak,
  Module,
  manifest
} from "./types";
import { Logger } from "../../";

import { PluginFactory, PluginPackage } from "@polywrap/plugin-js";

export interface AgentPluginConfig {
  logger: Logger;
}

export class AgentPlugin extends Module<AgentPluginConfig> {
  private _logger: Logger;

  constructor(config: AgentPluginConfig) {
    super(config);
    this._logger = this.config.logger;
  }

  public async speak(args: Args_speak): Promise<string> {
    await this._logger.success(args.message);
    return "";
  }

  public async ask(args: Args_ask): Promise<string> {
    const response = await this._logger.prompt(args.message);
    return "User: " + response;
  }

  public async onGoalAchieved(args: Args_onGoalAchieved): Promise<boolean> {
    await this._logger.success(args.message);
    return true;
  }

  public async onGoalFailed(args: Args_onGoalFailed): Promise<boolean> {
    await this._logger.error(args.message);
    return true;
  }
}

export const agentPlugin: PluginFactory<AgentPluginConfig> = (
  config: AgentPluginConfig
) => {
  return new PluginPackage(
    new AgentPlugin(config),
    manifest
  );
};
