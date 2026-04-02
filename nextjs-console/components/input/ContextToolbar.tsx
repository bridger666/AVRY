"use client"

import { useState } from "react"

type ToolType = "attach-context" | "execution-log" | "blueprint-mode" | "upload-file"

interface ContextToolbarProps {
  onToolSelect: (tool: ToolType) => void
}

const TOOL_CONFIG: { id: ToolType; label: string; icon: string }[] = [
  { id: "attach-context", label: "Attach Context", icon: "paperclip" },
  { id: "execution-log", label: "Execution Log", icon: "list" },
  { id: "blueprint-mode", label: "Blueprint Mode", icon: "layout" },
  { id: "upload-file", label: "Upload File", icon: "upload" },
]

export default function ContextToolbar({ onToolSelect }: ContextToolbarProps) {
  const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null)

  return (
    <div className="flex items-center gap-1 px-3 pb-2">
      {TOOL_CONFIG.map((tool) => {
        const isHovered = hoveredTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            onMouseEnter={() => setHoveredTool(tool.id)}
            onMouseLeave={() => setHoveredTool(null)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
              ${isHovered 
                ? "bg-white/10 text-white" 
                : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08]"
              }
            `}
            aria-label={tool.label}
            title={tool.label}
          >
            {getIcon(tool.icon, isHovered ? "text-white" : "text-zinc-400")}
            <span>{tool.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function getIcon(name: string, className: string) {
  const icons: Record<string, JSX.Element> = {
    paperclip: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
      </svg>
    ),
    list: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    layout: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    upload: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  }
  return icons[name] || null
}
