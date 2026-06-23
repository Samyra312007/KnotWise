export type C2cRealtimeEvent =
  | {
      type: "message";
      conversationId: string;
      message: {
        id: string;
        body: string;
        senderId: string;
        createdAt: string;
        readAt: string | null;
      };
    }
  | {
      type: "read";
      conversationId: string;
      readerId: string;
      readAt: string;
    };

export type ThreadRealtimeEvent = {
  type: "thread_message";
  threadId: string;
  message: {
    id: string;
    authorType: string;
    body: string;
    createdAt: string;
  };
};

export const C2C_EVENT_NAME = "c2c-event";
export const THREAD_EVENT_NAME = "thread-event";
