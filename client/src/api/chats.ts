import axios from "./axiosInstance"
import routes from "./routes"
import type { Chat } from "@/types/chats"

export const sendChatMessage = (chat: Partial<Chat>) => {
    const { docId:doc_id, content:question } = chat

    return axios.post(routes.chat.ask, {
        doc_id,
        question,
        stream: false
    })
}

export const fetchChatsByDocId = (docId: string) => {
    return axios.get(routes.chat.getChatsByDoc(docId))
}