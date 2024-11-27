"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutList, LayoutGrid } from "lucide-react";

import { IViewToggleProps } from "@/types/view-toggle";

const ViewToggle = ({
  onViewChange,
  defaultView = "list",
}: IViewToggleProps) => {
  const [currentView, setCurrentView] = useState<"list" | "grid">(defaultView);

  const handleViewChange = (view: "list" | "grid") => {
    setCurrentView(view);
    onViewChange(view);
  };

  return (
    <Tabs
      value={currentView}
      onValueChange={handleViewChange as (value: string) => void}
    >
      <TabsList>
        <TabsTrigger value="list">
          <LayoutList className="size-4" />
        </TabsTrigger>
        <TabsTrigger value="grid">
          <LayoutGrid className="size-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ViewToggle;
