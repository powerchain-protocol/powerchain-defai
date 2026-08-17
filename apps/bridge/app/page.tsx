import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/config/app-routes";

export default function HomePage() { redirect(APP_ROUTES.home); }
