"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleFormAction(formData: FormData) {
    setErrorMsg(null);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    startTransition(async () => {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setErrorMsg(error.message);
        else
          alert("Registrierung erfolgreich! Bitte bestätigen oder einloggen.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) setErrorMsg(error.message);
        else router.push("/");
      }
    });
  }
}
