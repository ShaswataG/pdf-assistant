import { useEffect } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/custom/app-sidebar"
import { useDocumentStore } from "@/stores/documentStore"
import axios from "@/api/axiosInstance";

export default function Layout({ children }: { children: React.ReactNode }) {
  
  const { getDocuments } = useDocumentStore()

  useEffect(() => {
    getDocuments()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="w-full">
        {children}
      </main> 
    </SidebarProvider>
  )
}
