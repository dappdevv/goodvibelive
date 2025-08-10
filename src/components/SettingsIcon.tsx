"use client";

import { useState, useEffect } from "react";
import {
  IconButton,
  Dialog,
  Heading,
  Flex,
  Button,
  Text,
} from "@radix-ui/themes";
import { GearIcon } from "@radix-ui/react-icons";

// Доступные пресеты градиентов
const GRADIENT_PRESETS = {
  auto: { name: "По цвету", from: "", to: "" }, // вычисляется от neonHue
  ocean: { name: "Океан", from: "#061a2b", to: "#0d3b66" },
  sunset: { name: "Закат", from: "#2b0b14", to: "#8a1f4a" },
  forest: { name: "Лес", from: "#071b13", to: "#0f3d28" },
  midnight: { name: "Полночь", from: "#0a0a23", to: "#1b1b3a" },
  magma: { name: "Магма", from: "#1a0b0b", to: "#421313" },
  aurora: { name: "Аврора", from: "#0b1b2b", to: "#203a43" },
  dusk: { name: "Сумерки", from: "#1e0b2b", to: "#3a1f5d" },
  cyber: { name: "Кибер", from: "#06121f", to: "#092a48" },
  candy: { name: "Кэнди", from: "#2b0b1f", to: "#5d1f3a" },
  lagoon: { name: "Лагуна", from: "#061f1b", to: "#0b3a2b" },
  flamingo: { name: "Фламинго", from: "#2b0a16", to: "#6a1e2b" },
  royal: { name: "Королевский", from: "#0d1023", to: "#232a52" },
  slate: { name: "Сланец", from: "#0c0f14", to: "#1a202c" },
  solar: { name: "Солярис", from: "#1a1208", to: "#3a2a0f" },
  indigo: { name: "Индиго", from: "#0a0a1a", to: "#1a1a3a" },
} as const;

type GradientKey = keyof typeof GRADIENT_PRESETS;

type UISettings = {
  neonHue: number; // 0-360, оттенок неонового свечения
  gradientKey: GradientKey; // выбранный пресет градиента
};

export default function SettingsIcon() {
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<UISettings>({
    neonHue: 200,
    gradientKey: "auto",
  }); // По умолчанию: синий оттенок и авто-градиент от цвета

  // Загрузка настроек из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem("neon-ui-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<UISettings>;
        const restored: UISettings = {
          neonHue: typeof parsed.neonHue === "number" ? parsed.neonHue : 200,
          gradientKey: (parsed.gradientKey as GradientKey) || "auto",
        };
        setSettings(restored);
        applyNeonColor(restored.neonHue);
        applyGradient(restored.gradientKey, restored.neonHue);
      } catch {
        // Игнорируем ошибки парсинга
      }
    }
  }, []);

  // Применение неонового цвета к CSS переменным (без изменения градиента)
  const applyNeonColor = (hue: number) => {
    const root = document.documentElement;
    const saturation = 80;
    const lightness = 60;

    // Основной неоновый цвет
    const neonColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const neonColorDark = `hsl(${hue}, ${saturation}%, ${lightness - 20}%)`;
    const neonColorLight = `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`;

    root.style.setProperty("--neon-primary", neonColor);
    root.style.setProperty("--neon-dark", neonColorDark);
    root.style.setProperty("--neon-light", neonColorLight);
  };

  // Применение выбранного градиента ко всему проекту (через CSS-переменные body)
  const applyGradient = (key: GradientKey, hue: number) => {
    const root = document.documentElement;
    if (key === "auto") {
      const from = `hsl(${hue}, 40%, 5%)`;
      const to = `hsl(${(hue + 60) % 360}, 30%, 8%)`;
      root.style.setProperty("--bg-gradient-from", from);
      root.style.setProperty("--bg-gradient-to", to);
      return;
    }
    const preset = GRADIENT_PRESETS[key];
    root.style.setProperty("--bg-gradient-from", preset.from);
    root.style.setProperty("--bg-gradient-to", preset.to);
  };

  // Обработчик скролла для изменения прозрачности
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = documentHeight - windowHeight;

      // Проверяем, достигнут ли край страницы
      const atBottom = scrollTop >= maxScroll - 10; // 10px допуск
      setIsAtBottom(atBottom);

      if (atBottom) {
        setScrollOpacity(1);
      } else {
        // Вычисляем прозрачность на основе позиции скролла
        const scrollPercentage = scrollTop / Math.max(maxScroll, 1);
        const opacity = Math.max(0.3, 1 - scrollPercentage * 0.7);
        setScrollOpacity(opacity);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Вызываем сразу для установки начального состояния

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHueChange = (newHue: number) => {
    const newSettings = { ...settings, neonHue: newHue };
    setSettings(newSettings);
    applyNeonColor(newHue);
    // Если выбран авто-градиент, обновим фон синхронно с изменением оттенка
    if (newSettings.gradientKey === "auto") {
      applyGradient("auto", newHue);
    }
  };

  const handleGradientPick = (key: GradientKey) => {
    setSettings((prev) => ({ ...prev, gradientKey: key }));
  };

  const applyButton = () => {
    applyGradient(settings.gradientKey, settings.neonHue);
  };

  const saveSettings = () => {
    localStorage.setItem("neon-ui-settings", JSON.stringify(settings));
    setIsModalOpen(false);
  };

  const iconStyle = {
    opacity: scrollOpacity,
    filter: isAtBottom
      ? `drop-shadow(0 0 20px hsl(${settings.neonHue}, 80%, 60%)) drop-shadow(0 0 40px hsl(${settings.neonHue}, 80%, 60%))`
      : `drop-shadow(0 0 10px hsl(${settings.neonHue}, 80%, 60%))`,
    transition: "all 0.3s ease-out",
  };

  return (
    <>
      {/* Фиксированная иконка настроек */}
      <div className="fixed top-4 left-4 z-50" style={iconStyle}>
        <IconButton
          size="3"
          variant="soft"
          className="backdrop-blur-sm bg-black/20 border border-white/10 hover:bg-black/40"
          onClick={() => setIsModalOpen(true)}
          title="Настройки UI"
        >
          <GearIcon width={20} height={20} />
        </IconButton>
      </div>

      {/* Модальное окно настроек */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Content
          className="max-w-md"
          style={{
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            border: `1px solid hsl(${settings.neonHue}, 80%, 60%, 0.3)`,
            boxShadow: `0 0 30px hsl(${settings.neonHue}, 80%, 60%, 0.2)`,
          }}
        >
          <Dialog.Title>
            <Heading
              size="5"
              className="mb-4"
              style={{ color: `hsl(${settings.neonHue}, 80%, 70%)` }}
            >
              Настройки UI
            </Heading>
          </Dialog.Title>

          <div className="space-y-6">
            {/* Слайдер для изменения цвета */}
            <div>
              <Text size="3" className="block mb-3 text-gray-300">
                Цвет неонового свечения
              </Text>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={settings.neonHue}
                  onChange={(e) => handleHueChange(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(0, 80%, 60%), 
                      hsl(60, 80%, 60%), 
                      hsl(120, 80%, 60%), 
                      hsl(180, 80%, 60%), 
                      hsl(240, 80%, 60%), 
                      hsl(300, 80%, 60%), 
                      hsl(360, 80%, 60%))`,
                  }}
                />
                <div className="flex justify-between items-center">
                  <Text size="2" className="text-gray-400">
                    Оттенок: {settings.neonHue}°
                  </Text>
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white/20"
                    style={{
                      backgroundColor: `hsl(${settings.neonHue}, 80%, 60%)`,
                      boxShadow: `0 0 15px hsl(${settings.neonHue}, 80%, 60%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Выбор градиента */}
            <div>
              <Text size="3" className="block mb-3 text-gray-300">
                Градиент фона
              </Text>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(GRADIENT_PRESETS) as GradientKey[]).map((key) => {
                  const preset = GRADIENT_PRESETS[key];
                  const isActive = settings.gradientKey === key;
                  // Для auto — превью от текущего оттенка
                  const from =
                    key === "auto"
                      ? `hsl(${settings.neonHue}, 40%, 5%)`
                      : preset.from;
                  const to =
                    key === "auto"
                      ? `hsl(${(settings.neonHue + 60) % 360}, 30%, 8%)`
                      : preset.to;
                  return (
                    <button
                      key={key}
                      onClick={() => handleGradientPick(key)}
                      className={`group rounded-md p-2 text-left border transition-all ${
                        isActive
                          ? "border-white/30 shadow-[0_0_0_2px_hsl(var(--neon-primary))]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                      title={preset.name}
                    >
                      <div
                        className="h-10 w-full rounded mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${from}, ${to})`,
                        }}
                      />
                      <Text size="2" className="text-gray-300">
                        {preset.name}
                      </Text>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Превью эффекта */}
            <div className="p-4 rounded-lg border border-white/10 bg-black/30">
              <Text size="2" className="text-gray-400 mb-2 block">
                Превью:
              </Text>
              <div
                className="p-3 rounded border text-center"
                style={{
                  borderColor: `hsl(${settings.neonHue}, 80%, 60%)`,
                  boxShadow: `0 0 20px hsl(${settings.neonHue}, 80%, 60%, 0.3)`,
                  color: `hsl(${settings.neonHue}, 80%, 70%)`,
                }}
              >
                Неоновый текст
              </div>
            </div>
          </div>

          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Отмена
              </Button>
            </Dialog.Close>
            <Button
              onClick={applyButton}
              variant="soft"
              className="font-medium"
              style={{
                borderColor: `hsl(${settings.neonHue}, 80%, 60%, 0.5)`,
              }}
            >
              Применить
            </Button>
            <Button
              onClick={saveSettings}
              className="font-medium"
              style={{
                backgroundColor: `hsl(${settings.neonHue}, 80%, 60%)`,
                color: "black",
              }}
            >
              Сохранить
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
