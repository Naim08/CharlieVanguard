import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/createBrowserClient";
import { useSession } from "next-auth/react";

export const useUpdateChatTitle = () => {
  const queryClient = useQueryClient();
  const { data : session } = useSession()

  return useMutation({
    mutationFn: async (args: { chatId: string; title: string }) => {
      if (!session?.supabaseAccessToken) {
        throw new Error("Not authenticated");
      }

      const supabase = createSupabaseBrowserClient(session.supabaseAccessToken);
      const { error } = await supabase
        .from("chats")
        .update({ title: args.title })
        .eq("id", args.chatId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
