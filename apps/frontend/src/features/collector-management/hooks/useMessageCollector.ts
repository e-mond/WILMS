import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services';
import { useToast } from '@/hooks/useToast';

export const messageThreadQueryKey = (threadId: string | null) =>
  ['message-thread', threadId] as const;

export function useMessageThread(threadId: string | null) {
  return useQuery({
    queryKey: messageThreadQueryKey(threadId),
    queryFn: () => messageService.getThread(threadId!),
    enabled: Boolean(threadId),
  });
}

export function useMessageCollector() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const createThread = useMutation({
    mutationFn: (collectorId: string) => messageService.createThread({ collectorId }),
    onError: () => {
      toast.error('Unable to open conversation', { message: 'Try again shortly.' });
    },
  });

  const sendMessage = useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      messageService.sendMessage({ threadId, body }),
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({ queryKey: messageThreadQueryKey(variables.threadId) });
    },
    onError: () => {
      toast.error('Unable to send message', { message: 'Try again shortly.' });
    },
  });

  return { createThread, sendMessage };
}
