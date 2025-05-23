import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchChatsByDocId, sendChatMessage } from '../api/chats'; // assume you have these
import type { Chat } from '@/types/chats';

interface ChatStore {
    chatsByDoc: Record<string, Chat[]>;

    // sync actions
    setChatsForDoc: (docId: string, chats: Chat[]) => void;
    addChatForDoc: (docId: string, chat: Chat) => void;
    updateChatByClientId: (docId: string, clientId: string, updatedChat: Partial<Chat>) => void;
    clearChats: () => void;

    // async actions
    fetchChats: (docId: string) => Promise<void>;
    sendChat: (docId: string, message: string) => Promise<void>;
    retryChat: (docId: string, clientId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            chatsByDoc: {},

            setChatsForDoc: (docId, chats) =>
                set((state) => ({
                    chatsByDoc: {
                        ...state.chatsByDoc,
                        [docId]: chats.map((c) => ({ ...c, status: 'sent' })),
                    },
                })),

            addChatForDoc: (docId, chat) =>
                set((state) => ({
                    chatsByDoc: {
                        ...state.chatsByDoc,
                        [docId]: [...(state.chatsByDoc[docId] || []), chat],
                    },
                })),

            updateChatByClientId: (docId, clientId, updatedChat) =>
                set((state) => ({
                    chatsByDoc: {
                        ...state.chatsByDoc,
                        [docId]: state.chatsByDoc[docId]?.map((chat) =>
                            chat.clientId === clientId ? { ...chat, ...updatedChat } : chat
                        ),
                    },
                })),

            clearChats: () => set({ chatsByDoc: {} }),

            fetchChats: async (docId) => {
                try {
                    const response = await fetchChatsByDocId(docId)

                    const chats: Chat[] = response?.data?.chats?.map((chat: any) => ({
                        id: chat.id,
                        docId: docId,
                        userId: chat.user_id ?? null,
                        content: chat.content,
                        isUserMessage: chat.is_user_message,
                        timestamp: chat.timestamp, // assuming the server sends this
                        status: 'sent',
                    })) || [];

                    get().setChatsForDoc(docId, chats);
                } catch (err) {
                    console.error('Error fetching chats:', err);
                }
            },

            sendChat: async (docId, message) => {
                const clientId = crypto.randomUUID();
                const tempChat: Chat = {
                    docId,
                    content: message,
                    userId: null,
                    isUserMessage: true,
                    clientId,
                    timestamp: new Date().toISOString(),
                    status: 'sending',
                };

                get().addChatForDoc(docId, tempChat);

                try {
                    const response = await sendChatMessage({
                        docId,
                        content: message
                    });

                    const { user_chat, ai_chat } = response.data


                    if (response?.data?.user_chat?.id) {
                        get().updateChatByClientId(docId, clientId, {
                            id: user_chat?.id,
                            docId: user_chat?.doc_id,
                            userId: user_chat?.user_id || '',
                            content: user_chat?.content,
                            isUserMessage: user_chat?.is_user_message,
                            timestamp: user_chat?.timestamp,
                            status: 'sent',
                            clientId: undefined,
                        });

                        get().addChatForDoc(docId, {
                            id: ai_chat?.id,
                            docId: ai_chat?.doc_id,
                            userId: ai_chat?.user_id || '',
                            content: ai_chat?.content,
                            isUserMessage: ai_chat?.is_user_message,
                            timestamp: ai_chat?.timestamp,
                            status: 'sent',
                            clientId: undefined,
                        });

                    } else {
                        console.warn('API did not return chat id');
                        get().updateChatByClientId(docId, clientId, { status: 'failed' });
                    }
                } catch (err) {
                    console.error('Failed to send chat:', err);
                    get().updateChatByClientId(docId, clientId, { status: 'failed' });
                }
            },

            retryChat: async (docId: string, clientId: string) => {
                const state = get();
                const chatToRetry = state.chatsByDoc[docId]?.find(c => c.clientId === clientId);

                if (!chatToRetry) {
                    console.warn(`No chat found with clientId: ${clientId}`);
                    return;
                }

                // Mark as retrying
                set((prevState) => ({
                    chatsByDoc: {
                        ...prevState.chatsByDoc,
                        [docId]: prevState.chatsByDoc[docId].map((c) =>
                            c.clientId === clientId ? { ...c, status: 'sending' } : c
                        ),
                    },
                }));

                try {
                    const response = await sendChatMessage({
                        docId: chatToRetry.docId,
                        userId: chatToRetry.userId,
                        content: chatToRetry.content,
                        isUserMessage: chatToRetry.isUserMessage,
                    });

                    const { user_chat, ai_chat } = response.data


                    if (response?.data?.user_chat?.id) {
                        get().updateChatByClientId(docId, clientId, {
                            id: user_chat?.id,
                            docId: user_chat?.doc_id,
                            userId: user_chat?.user_id || '',
                            content: user_chat?.content,
                            isUserMessage: user_chat?.is_user_message,
                            timestamp: user_chat?.timestamp,
                            status: 'sent',
                            clientId: undefined,
                        });

                        get().addChatForDoc(docId, {
                            id: ai_chat?.id,
                            docId: ai_chat?.doc_id,
                            userId: ai_chat?.user_id || '',
                            content: ai_chat?.content,
                            isUserMessage: ai_chat?.is_user_message,
                            timestamp: ai_chat?.timestamp,
                            status: 'sent',
                            clientId: undefined,
                        });
                    } else {
                        get().updateChatByClientId(docId, clientId, { status: 'failed' });
                    }
                } catch (err) {
                    console.error(`Retry failed for clientId: ${clientId}`, err);
                    get().updateChatByClientId(docId, clientId, { status: 'failed' });
                }
            }

        }),
        { name: 'chat-storage' }
    )
);
