import { useEffect } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/custom/app-sidebar"
import { useDocumentStore } from "@/stores/documentStore"

export default function Layout({ children }: { children: React.ReactNode }) {
  
  const { documentsByUser, getDocuments } = useDocumentStore()

  useEffect(() => {
    if (documentsByUser?.length === 0) {
      getDocuments()
    }
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger className="z-100" />
      <main className="w-full max-w-[1500px] mx-auto">
        {children}
      </main> 
    </SidebarProvider>
  )
}
