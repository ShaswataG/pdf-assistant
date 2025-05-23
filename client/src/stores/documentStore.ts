import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchDocumentsByUser, uploadDocument } from '@/api/documents'
import type { Document } from '@/types/documents'

interface DocumentStore {
    documentsByUser: Document[]
    currDocument: Document | null

    setDocumentsByUser: (documents: Document[]) => void
    addDocument: (doc: Document) => void
    removeDocumentById: (id: string) => void
    setCurrentDocument: (doc: Document | null) => void
    updateDocument: (updatedDoc: Document) => void
    clearDocuments: () => void
    getDocuments: () => Promise<void>
    uploadDocument: (formData: FormData) => Promise<Document>
}

export const useDocumentStore = create<DocumentStore>()(
    persist(
        (set, get) => ({
            documentsByUser: [],
            currDocument: null,

            setDocumentsByUser: (documents) => set({ documentsByUser: documents }),

            addDocument: async (doc) =>
                set((state) => ({
                    documentsByUser: [...state.documentsByUser, doc],
                })),

            removeDocumentById: (id) =>
                set((state) => ({
                    documentsByUser: state.documentsByUser.filter((d) => d.id !== id),
                    currDocument:
                        state.currDocument?.id === id ? null : state.currDocument,
                })),

            setCurrentDocument: (doc) => set({ currDocument: doc }),

            updateDocument: (updatedDoc) =>
                set((state) => ({
                    documentsByUser: state.documentsByUser.map((d) =>
                        d.id === updatedDoc.id ? updatedDoc : d
                    ),
                    currDocument:
                        state.currDocument?.id === updatedDoc.id
                            ? updatedDoc
                            : state.currDocument,
                })),

            clearDocuments: () =>
                set({
                    documentsByUser: [],
                    currDocument: null,
                }),



            // async acions
            getDocuments: async () => {
                try {
                    const response = await fetchDocumentsByUser(); // call your API
                    console.log('response: ', response)
                    set({ documentsByUser: response.data?.documents?.map((doc: any) => { return { id: doc.id, filename: doc.filename, uploadDate: doc.upload_date } }) });
                } catch (error) {
                    console.error("Failed to fetch documents:", error);
                }
            },
            uploadDocument: async (formData: FormData) => {
                const response = await uploadDocument(formData)
                const newDocument: Document = {
                    id: response?.data?.id,
                    filename: response?.data?.filename,
                    uploadDate: response?.data?.upload_date,
                    content: response?.data?.content
                }
                get().addDocument(newDocument)

                return newDocument
            }
        }),
        {
            name: 'document-storage', // persists to localStorage
        }
    )
)
