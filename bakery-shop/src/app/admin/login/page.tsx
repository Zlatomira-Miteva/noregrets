import { notFound } from "next/navigation";

// Admins се логват през нормалната форма за вход. Тази страница се счита за недостъпна.
export default function AdminLoginPage() {
  notFound();
}
