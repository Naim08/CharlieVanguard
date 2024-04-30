import { createEvoInstance } from "@/lib/services/evo/createEvoInstance";
import { GoalApi, ProxyEmbeddingApi, ProxyLlmApi } from "@/lib/api";
import { ChatLog } from "@/components/Chat";
import {
  Evo,
  ChatLogType,
  ChatMessage,
  Workspace,
  InMemoryWorkspace,
} from "@evo-ninja/agents";
import { Chat } from "@/lib/queries/useChats";

export interface EvoThreadConfig {
  chatId: string;
  loadChat: (chatId: string) => Promise<Chat>;
  loadWorkspace: (chatId: string) => Promise<Workspace>;
  onChatLogAdded: (chatLog: ChatLog) => Promise<void>;
  onMessagesAdded: (
    type: ChatLogType,
    messages: ChatMessage[]
  ) => Promise<void>;
  onVariableSet: (key: string, value: string) => Promise<void>;
}

export interface EvoThreadState {
  goal: string | undefined;
  evo: Evo | undefined;
  status: string | undefined;
  isRunning: boolean;
  isLoading: boolean;
  chat: Chat | undefined;
  workspace: Workspace;
}

export interface EvoThreadCallbacks {
  setStatus: (status?: string) => void;
  setIsRunning: (value: boolean) => void;
  setChatLog: (chatLog: ChatLog[]) => void;
  setWorkspace: (workspace: Workspace | undefined) => Promise<void>;
  onGoalCapReached: () => void;
  onError: (error: string) => void;
}

export interface EvoThreadStartOptions {
  goal: string;
  allowTelemetry: boolean;
  openAiApiKey?: string;
}

const INIT_STATE: EvoThreadState = {
  goal: undefined,
  evo: undefined,
  status: undefined,
  isRunning: false,
  isLoading: false,
  chat: undefined,
  workspace: new InMemoryWorkspace()
};

export class EvoThread {
  private _state: EvoThreadState;
  private _callbacks?: EvoThreadCallbacks;

  protected constructor(
    private _config: EvoThreadConfig
  ) {
    this._state = Object.assign({}, INIT_STATE);
  }

  get chatId(): string {
    return this._config.chatId;
  }

  public static async load(
    config: EvoThreadConfig
  ): Promise<EvoThread> {
    const thread = new EvoThread(config);

    const chatId = thread._config.chatId;
    thread._state.isLoading = true;

    const results = await Promise.all<[
      Promise<Chat>,
      Promise<Workspace>
    ]>([
      thread._config.loadChat(chatId).catch((reason) => {
        thread._callbacks?.onError(reason.toString());
        throw reason;
      }),
      thread._config.loadWorkspace(chatId).catch((reason) => {
        thread._callbacks?.onError(reason.toString());
        return new InMemoryWorkspace();
      })
    ]);

    thread._state.chat = results[0];
    thread._state.workspace = results[1];
    thread._state.isLoading = false;

    return thread;
  }

  destroy() {
    // Destroy all child objects & processes
  }

  disconnect() {
    if (!this._callbacks) {
      return;
    }

    // Dispatch reset values
    this._callbacks.setStatus(INIT_STATE.status);
    this._callbacks.setIsRunning(INIT_STATE.isRunning);
    this._callbacks.setChatLog([]);
    this._callbacks.setWorkspace(undefined);

    // Disconnect all callbacks
    this._callbacks = undefined;
  }

  async connect(callbacks: EvoThreadCallbacks): Promise<void> {
    // Save callbacks
    this._callbacks = callbacks;

    // Wait until loading has finished
    await this.waitForLoad();

    if (!this._callbacks) {
      return;
    }

    // Send current state to newly connected callbacks
    this._callbacks.setStatus(this._state.status);
    this._callbacks.setIsRunning(this._state.isRunning);
    this._callbacks.setChatLog(this._state.chat!.logs);
    await this._callbacks.setWorkspace(this._state.workspace);
  }

  async start(options: EvoThreadStartOptions): Promise<void> {
    const {
      goal,
      allowTelemetry,
      openAiApiKey
    } = options;

    if (this._state.isRunning) {
      if (this._state.goal !== options.goal) {
        this._callbacks?.onError("A goal is already underway.");
      }
      return;
    }

    this._state.goal = options.goal;
    this.setIsRunning(true);

    // Wait until loading has finished
    await this.waitForLoad();

    // Acquire a GoalID
    const subsidize = !openAiApiKey;
    const goalId = await GoalApi.create(
      this.chatId,
      allowTelemetry ? goal : "<redacted>",
      subsidize,
      () => this._callbacks?.onGoalCapReached()
    );

    if (!goalId) {
      this._callbacks?.onError("Unable to acquire a goal ID.");
      this.setIsRunning(false);
      return;
    }

    if (!this._state.evo) {
      const evo = createEvoInstance(
        this._state.workspace,
        options.openAiApiKey,
        this._config.onMessagesAdded,
        this._config.onVariableSet,
        (chatLog) => this.onChatLog(chatLog),
        (status) => this.onStatusUpdate(status),
        () => this._callbacks?.onGoalCapReached(),
        (error) => this._callbacks?.onError(error)
      );

      if (!evo) {
        this.setIsRunning(false);
        return;
      }

      this._state.evo = evo;

      if (this._state.chat?.messages.length) {
        await this._state.evo.context.chat.addWithoutEvents(
          "persistent",
          this._state.chat.messages
            .filter(x => !x.temporary)
            .map(x => x.msg)
        );
        await this._state.evo.context.chat.addWithoutEvents(
          "temporary",
          this._state.chat.messages
            .filter(x => x.temporary)
            .map(x => x.msg)
        );
      } else {
        await this._state.evo.init();
      }
    }

    const { llm, embedding } = this._state.evo.context;

    if (llm instanceof ProxyLlmApi) {
      llm.setGoalId(goalId);
    } 
    if (embedding instanceof ProxyEmbeddingApi) {
      embedding.setGoalId(goalId);
    }

    // Run the evo instance against the goal
    await this.runEvo(this._state.evo, options.goal);
    this._state.goal = undefined;
  }

  private async waitForLoad() {
    while (this._state.isLoading) {
      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );
    }
    return Promise.resolve();
  }

  private setIsRunning(value: boolean) {
    this._state.isRunning = value;
    this._callbacks?.setIsRunning(value);
  }

  private async onChatLog(chatLog: ChatLog): Promise<void> {
    this._state.chat!.logs = [...this._state.chat!.logs, chatLog];
    this._callbacks?.setChatLog(this._state.chat!.logs);
    await this._config.onChatLogAdded(chatLog);
  }

  private onStatusUpdate(status: string): void {
    this._state.status = status;
    this._callbacks?.setStatus(status);
  }

  private async runEvo(evo: Evo, goal: string): Promise<void> {
    const iterator = evo.run({ goal });

    await this.onChatLog({
      title: goal,
      user: "user"
    });

    let stepCounter = 1;

    while (this._state.isRunning) {
      await this.onChatLog({
        title: `## Step ${stepCounter}`,
        user: "evo",
      });
      const response = await iterator.next();

      this._callbacks?.setWorkspace(this._state.workspace);

      if (response.done) {
        // If value is not present is because an unhandled error has happened in Evo
        if ("value" in response.value) {
          const isSuccess = response.value.value.type === "success";
          const message = {
            title: `## Goal has ${isSuccess ? "" : "not"} been achieved`,
            user: "evo",
          };
          await this.onChatLog(message);
        }
        this.setIsRunning(false);
        evo?.reset();
        break;
      }

      if (!response.done) {
        const evoMessage = {
          title: `### Action executed:\n${response.value.title}`,
          content: response.value.content,
          user: "evo",
        };
        await this.onChatLog(evoMessage);
      }

      stepCounter++;
    }
  }
}
