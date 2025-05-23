import { useParams, useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";
import { Send, SendHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { useChatStore } from "@/stores/chatStore";
import { useEffect, useState, useRef } from "react";

export default function Document() {
    const [isSending, setIsSending] = useState(false)

    const { docId } = useParams();
    const navigate = useNavigate();

    const { chatsByDoc, fetchChats, sendChat, retryChat } = useChatStore()

    const [message, setMessage] = useState("");
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const chats = docId ? chatsByDoc[docId] || [] : [];

    const handleSend = async () => {
        setIsSending(true)

        try {
            if (docId) {
                await sendChat(docId, message)
            }
        } catch (error) {
            console.error("Failed to send chat:", error);
        } finally {
            setIsSending(false)
            setMessage('')
        }
    }

    useEffect(() => {
        if (docId && docId !== "new") {
            fetchChats(docId);
        }
    }, [docId, fetchChats]);

    useEffect(() => {
        if (docId)
            console.log(`chatsByDoc[${docId}]: `, chatsByDoc[docId])
    }, [chatsByDoc])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats]);

    return (
        <div className="w-full h-full max-h-[84vh] flex flex-col justify-between p-4 relative top-[80px]">
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                {
                chats.length === 0
                &&
                <p className="text-muted-foreground">No chats found</p>    
                }
                {chats.map((chat) => (
                    <div
                        key={chat.id || chat.clientId}
                        className={`flex ${chat.isUserMessage ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`rounded-lg p-2 max-w-sm text-sm shadow-md ${chat.isUserMessage
                                    ? "bg-blue-100 text-right"
                                    : "bg-gray-100 text-left"
                                }`}
                        >
                            <p>{chat.content}</p>
                            {chat.isUserMessage && chat.status === "failed" && (
                                <div className="flex justify-end mt-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-500"
                                        onClick={() => retryChat(chat.docId, chat.clientId!)}
                                    >
                                        <RotateCcw size={16} />
                                    </Button>
                                </div>
                            )}
                            {chat.isUserMessage && chat.status === "sending" && (
                                <div className="flex justify-end mt-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-500"
                                        onClick={() => retryChat(chat.docId, chat.clientId!)}
                                    >
                                        <Loader2 className="animate-spin" size={16}/>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div className="flex items-center justify-between gap-2 border-t pt-2">
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 resize-none"
                />
                <Button onClick={handleSend} disabled={isSending}>
                    {
                        isSending ? (
                            <>
                                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            </>
                        ) : (
                            <>
                                <Send />
                            </>
                        )}
                </Button>
            </div>
        </div>
    )
}