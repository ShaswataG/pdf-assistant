import { useParams } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";
import { SendHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import { useChatStore } from "@/stores/chatStore";
import { useEffect, useState, useRef } from "react";
import userLogo from "@/assets/userLogo.png"
import botLogo from "@/assets/botLogo.png"

export default function Document() {
    const [isSending, setIsSending] = useState(false)

    const { docId } = useParams();

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
            <div className="flex flex-col gap-2 overflow-y-auto space-y-2 mb-4 pr-2">
                {
                chats.length === 0
                &&
                <p className="text-muted-foreground">No chats found</p>    
                }
                {chats.map((chat) => (
                    <div
                        key={chat.id || chat.clientId}
                        className="flex justify-start gap-6 p-2"
                    >   
                        <div className="w-[36px] h-[36px]">
                            <img src={chat.isUserMessage === true ? userLogo : botLogo} alt="user logo"/>
                        </div>
                        <div
                            className={`rounded-lg w-2xl text-sm text-left`}
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

            <div className="flex items-center justify-between gap-2 border-t pt-2 px-2 max-w-full border rounded-md">
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message..."
                    className="flex-1 resize-none max-w-full border-none outline-none focus-visible:border-none focus-visible:ring-0 p-2"
                />
                <Button onClick={handleSend} disabled={isSending} className={`p-2 rounded-md ${isSending ? 'bg-gray-200' : 'bg-white'} hover:bg-white hover:scale-1.5`}>
                    {
                        isSending ? (
                            <>
                                <Loader2 color="#000000" className="animate-spin mr-2 h-4 w-4" />
                            </>
                        ) : (
                            <>
                                {/* <Send /> */}
                                <SendHorizontal color="#000000" className="bg-transparent" />
                            </>
                        )}
                </Button>
            </div>
        </div>
    )
}