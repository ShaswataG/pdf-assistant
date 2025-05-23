import axios from "./axiosInstance"
import routes from "./routes"


export const fetchDocumentsByUser = () => {
    return axios.get(routes.document.getAll)
}

export const getDocumentById = (documentId: string) => {
    return axios.get(routes.document.getById(documentId))
}

export const uploadDocument = (formData: any) => {
    return axios.post(routes.document.upload, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
    })
}