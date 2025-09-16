"use client"; // jeśli to jest plik w app routerze i używa interakcji

import * as React from "react";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DesignProvider } from "@/store/designStore";
import { TopBar } from "@/components/TopBar/TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileAssistant } from "@/components/Mobile/MobileAssistant";
import { CanvasStage } from "@/components/Canvas/CanvasStage";
import { LayoutPanel } from "@/components/Panels/LayoutPanel";
import { StylePanel } from "@/components/Panels/StylePanel";
import { ProjectPanel } from "@/components/Panels/ProjectPanel";
import { SegmentStylePanel } from "@/components/Panels/SegmentStylePanel";
import { DimensionsPanel } from "@/components/Panels/DimensionsPanel";
import { AddOnsPanel } from "@/components/Panels/AddOnsPanel";
import { DividersPanel } from "@/components/Panels/DividersPanel";
import { TutorialOverlay } from "@/components/Tutorial/TutorialOverlay";

export default function Home() {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <DesignProvider>
        <div className="min-h-dvh flex items-center justify-center text-sm text-gray-500">Ładowanie…</div>
      </DesignProvider>
    )
  }
  return (
    <DesignProvider>
      <div className="min-h-dvh flex flex-col bg-gray-100">
        <TopBar />

        {isMobile ? (
          // Mobile assistant wizard
          <div className="flex-1 flex min-h-0">
            <MobileAssistant />
          </div>
        ) : (
          <>
            {/* Pasek z dropdownami */}
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex gap-2" data-tutorial="panel-bar">
              <PanelDropdown label="Projekt">
                <ProjectPanel />
              </PanelDropdown>

              <PanelDropdown label="Układ">
                <LayoutPanel />
              </PanelDropdown>

              <PanelDropdown label="Styl">
                <StylePanel />
                <SegmentStylePanel />
              </PanelDropdown>

              <PanelDropdown label="Wymiary">
                <DimensionsPanel />
              </PanelDropdown>
              <PanelDropdown label="Dodatki">
                <AddOnsPanel />
              </PanelDropdown>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex h-full overflow-hidden">
              <div className="flex-1 flex flex-col">
                <CanvasStage />
              </div>
            </div>
            <TutorialOverlay />
          </>
        )}
      </div>
    </DesignProvider>
  );
}

/** Reużywalny wrapper dla dropdownu z dowolną zawartością panelu */
function PanelDropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="px-3 py-1.5 rounded-md border text-black border-gray-300 bg-white text-sm shadow-sm hover:bg-gray-50"
          aria-label={label}
          data-tutorial={`panel-${label.toLowerCase()}`}
        >
          {label}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="start"
          className="w-[360px] max-h-[70vh] overflow-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
        >
          {children}
          <DropdownMenu.Arrow className="fill-white drop-shadow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
