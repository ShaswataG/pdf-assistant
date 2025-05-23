const routes = {
    auth: {
        login: "/auth/login",
        register: "/auth/register",
        logout: "/auth/logout",
    },
    document: {
        getAll: "/documents",
        getById: (id: string) => `/documents/${id}`,
        upload: "/upload",
    },
    chat: {
        getChatsByDoc: (docId: string) => `/chats/${docId}`,
        ask: "/ask"
    }
};

export default routes;  