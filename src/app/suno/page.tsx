"use client";

import Suno from "@/components/Suno";
import { Container } from "@radix-ui/themes";

export default function SunoPage() {
  return (
    <Container size="3" className="py-10">
      <Suno />
    </Container>
  );
}
