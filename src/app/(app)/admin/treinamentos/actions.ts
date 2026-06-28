"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";

export async function criarArea(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const nome = formData.get("nome") as string;

  await supabase.from("areas").insert({ nome });

  revalidatePath("/admin/treinamentos");
}

export async function removerArea(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const areaId = formData.get("areaId") as string;

  await supabase.from("areas").delete().eq("id", areaId);

  revalidatePath("/admin/treinamentos");
}
