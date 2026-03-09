"use client";

import { useRouter } from "next/navigation";

export default function CreateNewsPage() {
  const router = useRouter();

  // Use the dynamic page handler for creation
  return router.push("/admin/news/new");
}
