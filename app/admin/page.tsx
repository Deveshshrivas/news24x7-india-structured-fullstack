import { redirect } from "next/navigation";
import { getAppUser } from "../app-auth";
import AdminDashboard from "./AdminDashboard";
import { permissions,roleLabels } from "./roles";
export const dynamic = "force-dynamic";
export default async function AdminPage(){const user=await getAppUser();if(!user)redirect("/login?next=/admin");return <AdminDashboard user={{name:user.name,email:user.email}} roleLabel={roleLabels[user.role]} allowed={permissions[user.role]} signout="/logout"/>}
