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

// Menu items.
const items = [
  {
    title: "Computer Networks",
    url: "1",
    icon: Home,
  },
  {
    title: "Compiler Design",
    url: "2",
    icon: Inbox,
  },
  {
    title: "Database Management System",
    url: "3",
    icon: Calendar,
  },
  {
    title: "Operating System",
    url: "4",
    icon: Search,
  },
  {
    title: "Settings",
    url: "5",
    icon: Settings,
  },
]

export function AppSidebar() {

  const { documentsByUser:items } = useDocumentStore()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
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
