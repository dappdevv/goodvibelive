"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { Button, Flex, Heading, Separator, Text } from "@radix-ui/themes";

type AuthPanelProps = {
  onSignedIn?: () => void;
};

export default function AuthPanel({ onSignedIn }: AuthPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInEmailPassword() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data?.user && onSignedIn) onSignedIn();
  }

  async function signUpEmailPassword() {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data?.user && onSignedIn) onSignedIn();
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && onSignedIn) onSignedIn();
    });
    return () => sub.subscription.unsubscribe();
  }, [onSignedIn]);

  return (
    <div>
      <Heading size="5" className="mb-3">Вход по Email / Паролю</Heading>
      <Flex direction="column" gap="3">
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2"
        />
        <input
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-[color:var(--border)] bg-transparent px-3 py-2"
        />
        {error && (
          <Text color="red" size="2">{error}</Text>
        )}
        <Flex gap="3">
          <Button onClick={signInEmailPassword} disabled={loading}>
            Войти
          </Button>
          <Button variant="soft" onClick={signUpEmailPassword} disabled={loading}>
            Регистрация
          </Button>
        </Flex>
      </Flex>
      <Separator my="4" size="4" />
      <Heading size="5" className="mb-3">Или через Google</Heading>
      <Button color="green" onClick={signInWithGoogle}>Войти через Google</Button>
    </div>
  );
}


