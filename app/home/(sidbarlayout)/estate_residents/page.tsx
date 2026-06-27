"use client";

import { useRouter } from "next/navigation";
import ResidentsOverviewPage from "@/app/HomeComponents/EstateResidents";

export default function Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return <ResidentsOverviewPage all={true} onBack={handleBack} />;
}
