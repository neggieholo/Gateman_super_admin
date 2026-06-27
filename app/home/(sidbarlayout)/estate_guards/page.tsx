"use client";

import { useRouter } from "next/navigation";
import SecurityPersonnelPage from "@/app/HomeComponents/EstateSecurity";

export default function Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return <SecurityPersonnelPage all={true} onBack={handleBack} />;
}
