import { redirect } from "next/navigation";

export default function CreateNewsPage() {
  redirect("/admin/news/new");
}
