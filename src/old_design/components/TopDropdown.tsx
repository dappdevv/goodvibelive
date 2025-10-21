"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function TopDropdown() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="neon-purple-trigger inline-flex items-center justify-center rounded-md px-3 py-2 text-sm"
            aria-label="Открыть меню"
          >
            <HamburgerMenuIcon />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="neon-purple-content min-w-[180px] rounded-md p-1"
          >
            <DropdownMenu.Label className="px-2 py-1 text-xs opacity-80">
              Меню
            </DropdownMenu.Label>
            <DropdownMenu.Item asChild>
              <Link href="/" className="dropdown-item">
                Главная
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href="/dashboard" className="dropdown-item">
                Дашборд
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href="/docs" className="dropdown-item">
                Документация
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href="/suno" className="dropdown-item">
                Suno
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link href="/images" className="dropdown-item">
                Изображения
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
            <DropdownMenu.Item asChild>
              <Link href="/profile" className="dropdown-item">
                Профиль
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Arrow className="fill-[color:var(--card)] drop-shadow-[0_0_6px_var(--neon-purple)]" />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
