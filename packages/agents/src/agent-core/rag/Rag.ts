import { StandardRagBuilder } from "./StandardRagBuilder";
import { AgentContext } from "../agent/AgentContext";
import { TextChunker, TextRecombiner } from "../chunking";
import { SyncWorkspace } from "@evo-ninja/agent-utils";

export class Rag {
  static standard<TItem = string>(
    context: AgentContext,
    collectionName?: string,
    workspace?: SyncWorkspace,
    items?: TItem[]
  ): StandardRagBuilder<TItem> {
    return new StandardRagBuilder<TItem>(
      context,
      collectionName,
      workspace,
      items
    );
  }

  static async filterWithSurroundingText(
    text: string,
    queryOrQueryVector: string | number[],
    context: AgentContext,
    opts: {
      tokenLimit: number;
      surroundingCharacters: number;
      chunkLength: number;
      overlap: number;
    }
  ): Promise<string> {
    const { tokenLimit, surroundingCharacters, chunkLength, overlap } = opts;

    return Rag.standard(context)
      .addItems(
        TextChunker.fixedCharacterLength(text, {
          chunkLength: chunkLength,
          overlap,
        })
      )
      .query(queryOrQueryVector)
      .recombine(
        TextRecombiner.surroundingTextWithPreview(
          surroundingCharacters,
          "...\n",
          tokenLimit,
          context.chat.tokenizer,
          overlap
        )
      );
  }
}
