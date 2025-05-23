import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useDocumentStore } from "@/stores/documentStore"
import { useParams } from "react-router-dom"

export function AppSidebar() {

  const { docId } = useParams()

  const { documentsByUser:items } = useDocumentStore()

  return (
    <Sidebar className="z-100">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild className={`${item.id === docId ? 'bg-[#949494] text-[white] ' : ''}`}>
                    <a href={item.id}>
                      <span>{item.filename}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
