"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
  TextArea,
  Separator,
  ScrollArea,
  Badge,
} from "@radix-ui/themes";
import Image from "next/image";

type TaskStatus = "pending" | "processing" | "completed" | "failed";
type Task = {
  id: string;
  prompt: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  // Новые поля из документации API
  progress?: string;
  buttons?: Array<{
    customId: string;
    emoji: string;
    label: string;
    type: number;
    style: number;
  }>;
  properties?: {
    notifyHook?: string;
    flags?: number;
    messageId?: string;
    messageHash?: string;
    nonce?: string;
    customId?: string;
    finalPrompt?: string;
    progressMessageId?: string;
    messageContent?: string;
    discordInstanceId?: string;
    discordChannelId?: string;
  };
};

export default function ImageGeneration() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");

  // Загружаем сохранённые задачи из localStorage и обновляем их статусы
  useEffect(() => {
    const loadAndRefreshTasks = async () => {
      try {
        const saved = localStorage.getItem("midjourney-tasks");
        if (saved) {
          const parsedTasks = JSON.parse(saved);
          console.log("Loaded saved tasks:", parsedTasks.length);
          setTasks(parsedTasks);
          
          // Небольшая задержка перед обновлением, чтобы UI успел загрузиться
          setTimeout(() => {
            refreshAllTasks();
          }, 1000);
        }
      } catch (e) {
        console.warn("Failed to load saved tasks:", e);
      }
    };
    
    loadAndRefreshTasks();
  }, []);

  // Сохраняем задачи в localStorage
  useEffect(() => {
    try {
      localStorage.setItem("midjourney-tasks", JSON.stringify(tasks));
    } catch (e) {
      console.warn("Failed to save tasks:", e);
    }
  }, [tasks]);

  async function generateImage() {
    if (!prompt.trim()) {
      setError("Введите описание изображения");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/midjourney", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          botType: "MID_JOURNEY",
          accountFilter: {
            modes: ["FAST"]
          }
        }),
      });

      const data = await response.json();
      console.log("Create task response:", data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      // Проверяем структуру ответа согласно документации Imagine API
      if (data.code !== 1) {
        throw new Error(data.description || "Unknown error");
      }

      const taskId = String(data.result);
      console.log("Created task ID:", taskId);
      
      // Логируем полный ответ для отладки
      console.log("Task creation successful:", {
        code: data.code,
        description: data.description,
        result: data.result,
        properties: data.properties
      });
      
      const newTask: Task = {
        id: taskId,
        prompt: prompt.trim(),
        status: "pending",
        createdAt: Date.now(),
      };
      
      console.log("Creating new task:", newTask);

      setTasks(prev => [newTask, ...prev]);
      setPrompt("");

      // Начинаем отслеживание задачи
      pollTask(taskId);

    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function pollTask(taskId: string) {
    const maxAttempts = 60; // 5 минут максимум
    let attempts = 0;

    const poll = async () => {
      try {
        console.log(`Polling task ${taskId}, attempt ${attempts + 1}/${maxAttempts}`);
        const response = await fetch(`/api/midjourney/task?taskId=${taskId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        // Используем правильную структуру ответа из документации
        const taskData = data.result || data;
        const status = taskData.status || taskData.state;

        console.log(`Task ${taskId} status:`, status, "Full data:", JSON.stringify(taskData, null, 2));
        
        // Детальное логирование для отладки согласно документации
        console.log("Available image data:", {
          imageUrl: taskData.imageUrl,
          status: taskData.status,
          state: taskData.state,
          progress: taskData.progress,
          failReason: taskData.failReason,
          buttons: taskData.buttons,
          properties: taskData.properties,
          fullData: JSON.stringify(taskData, null, 2)
        });

        // Используем правильное поле imageUrl из документации
        const imageUrl = taskData.imageUrl;
        
        console.log("Extracted image URL:", imageUrl);

        // Определяем статус на основе полей из документации
        let taskStatus: TaskStatus;
        if (status === "SUCCESS" || status === "COMPLETED") {
          taskStatus = "completed";
        } else if (status === "FAILURE" || status === "FAILED") {
          taskStatus = "failed";
        } else if (status === "IN_PROGRESS" || status === "PROCESSING" || status === "PENDING") {
          taskStatus = "processing";
        } else {
          taskStatus = "pending";
        }

        setTasks(prev => prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: taskStatus,
                result: imageUrl,
                error: taskData.failReason || taskData.error,
                progress: taskData.progress,
                buttons: taskData.buttons,
                properties: taskData.properties,
                completedAt: (taskStatus === "completed" || taskStatus === "failed") ? Date.now() : undefined,
              }
            : task
        ));
        
        console.log("Updated task with image URL:", imageUrl);

        // Если задача не завершена и не превышен лимит попыток, продолжаем опрос
        if ((status === "IN_PROGRESS" || status === "PROCESSING" || status === "PENDING") && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 5000); // Опрос каждые 5 секунд
        }

      } catch (e) {
        console.error("Polling error:", e);
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: "failed", error: (e as Error).message }
            : task
        ));
      }
    };

    poll();
  }

  function getStatusColor(status: TaskStatus) {
    switch (status) {
      case "completed": return "green";
      case "failed": return "red";
      case "processing": return "blue";
      default: return "gray";
    }
  }

  function getStatusText(status: TaskStatus) {
    switch (status) {
      case "completed": return "Готово";
      case "failed": return "Ошибка";
      case "processing": return "Обработка";
      default: return "Ожидание";
    }
  }

  // Функции для управления модальным окном редактирования
  function openEditModal(taskId: string) {
    setEditingTask(taskId);
    setEditPrompt("");
  }

  function closeEditModal() {
    setEditingTask(null);
    setEditPrompt("");
  }

  // Функция для подтверждения редактирования
  async function confirmEdit() {
    if (editingTask) {
      await editImage(editingTask, editPrompt);
      closeEditModal();
    }
  }

  // Функция для получения обновлений всех задач
  async function refreshAllTasks() {
    if (tasks.length === 0) return;
    
    console.log(`Refreshing ${tasks.length} tasks...`);
    setLoading(true);
    
    try {
      // Создаем массив промисов для параллельной загрузки
      const updatePromises = tasks.map(async (task) => {
        // Пропускаем уже завершенные или failed задачи
        if (task.status === "completed" || task.status === "failed") {
          return task;
        }
        
        try {
          const response = await fetch(`/api/midjourney/task?taskId=${task.id}`);
          const data = await response.json();
          
          if (!response.ok) {
            console.error(`Failed to refresh task ${task.id}:`, data.error);
            return task;
          }
          
          const taskData = data.result || data;
          const status = taskData.status || taskData.state;
          const imageUrl = taskData.imageUrl;
          
          // Определяем статус
          let taskStatus: TaskStatus;
          if (status === "SUCCESS" || status === "COMPLETED") {
            taskStatus = "completed";
          } else if (status === "FAILURE" || status === "FAILED") {
            taskStatus = "failed";
          } else if (status === "IN_PROGRESS" || status === "PROCESSING" || status === "PENDING") {
            taskStatus = "processing";
          } else {
            taskStatus = "pending";
          }
          
          console.log(`Task ${task.id} refreshed:`, {
            oldStatus: task.status,
            newStatus: taskStatus,
            imageUrl: imageUrl
          });
          
          return {
            ...task,
            status: taskStatus,
            result: imageUrl || task.result,
            error: taskData.failReason || taskData.error,
            progress: taskData.progress,
            buttons: taskData.buttons,
            properties: taskData.properties,
            completedAt: (taskStatus === "completed" || taskStatus === "failed") ? Date.now() : undefined,
          };
        } catch (error) {
          console.error(`Error refreshing task ${task.id}:`, error);
          return task;
        }
      });
      
      // Выполняем все запросы параллельно
      const updatedTasks = await Promise.all(updatePromises);
      
      // Обновляем состояние
      setTasks(updatedTasks);
      
      // Запускаем polling для задач, которые все еще в процессе
      updatedTasks.forEach(task => {
        if (task.status === "processing" || task.status === "pending") {
          pollTask(task.id);
        }
      });
      
      console.log("All tasks refreshed successfully");
    } catch (error) {
      console.error("Error refreshing all tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  // Функция для ручного обновления задачи
  async function refreshTask(taskId: string) {
    try {
      const response = await fetch(`/api/midjourney/task?taskId=${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const taskData = data.result || data;
      const status = taskData.status || taskData.state;
      
      // Используем правильное поле imageUrl из документации
      const imageUrl = taskData.imageUrl;
      
      // Определяем статус на основе полей из документации
      let taskStatus: TaskStatus;
      if (status === "SUCCESS" || status === "COMPLETED") {
        taskStatus = "completed";
      } else if (status === "FAILURE" || status === "FAILED") {
        taskStatus = "failed";
      } else if (status === "IN_PROGRESS" || status === "PROCESSING" || status === "PENDING") {
        taskStatus = "processing";
      } else {
        taskStatus = "pending";
      }

      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: taskStatus,
              result: imageUrl,
              error: taskData.failReason || taskData.error,
              progress: taskData.progress,
              buttons: taskData.buttons,
              properties: taskData.properties,
              completedAt: (taskStatus === "completed" || taskStatus === "failed") ? Date.now() : undefined,
            }
          : task
      ));
    } catch (error) {
      console.error("Failed to refresh task:", error);
    }
  }

  // Функция для проверки доступности изображения
  async function checkImageUrl(url: string) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log("Image URL check:", url, "Status:", response.status, "OK:", response.ok);
      return response.ok;
    } catch (error) {
      console.error("Image URL check failed:", url, error);
      return false;
    }
  }

  // Функция для исправления URL изображения
  async function fixImageUrl(taskId: string) {
    try {
      const response = await fetch(`/api/midjourney/task?taskId=${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const taskData = data.result || data;
      console.log("Trying to fix image URL for task:", taskId, taskData);

      // Ищем URL в различных возможных полях
      const possibleUrls = [
        taskData.imageUrl,
        taskData.imageUrls?.[0],
        taskData.url,
        taskData.responseData?.url,
        taskData.data?.url,
        taskData.imgUrl,
        taskData.pictureUrl,
        taskData.photoUrl,
        taskData.image,
      ].filter(Boolean);

      console.log("Possible URLs found:", possibleUrls);

      for (const url of possibleUrls) {
        if (url && await checkImageUrl(url)) {
          console.log("Found working URL:", url);
          setTasks(prev => prev.map(task =>
            task.id === taskId
              ? { ...task, result: url }
              : task
          ));
          return url;
        }
      }

      console.log("No working URL found");
      return null;
    } catch (error) {
      console.error("Failed to fix image URL:", error);
      return null;
    }
  }

  // Функция для редактирования изображения
  async function editImage(taskId: string, editPrompt: string, maskBase64?: string) {
    if (!editPrompt.trim()) {
      alert("Введите описание редактирования");
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.result) {
      alert("Изображение не найдено");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Конвертируем изображение в base64 если это URL
      let imageBase64 = task.result;
      if (task.result.startsWith('http')) {
        const response = await fetch(task.result);
        const blob = await response.blob();
        const reader = new FileReader();
        
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch("/api/midjourney/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: editPrompt.trim(),
          image: imageBase64,
          maskBase64: maskBase64,
          botType: "MID_JOURNEY",
          accountFilter: {
            modes: ["FAST"]
          }
        }),
      });

      const data = await response.json();
      console.log("Editor response:", data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.code !== 1) {
        throw new Error(data.description || "Unknown error");
      }

      const newTaskId = String(data.result);
      console.log("Created editor task ID:", newTaskId);
      
      const newTask: Task = {
        id: newTaskId,
        prompt: `Редактирование: ${editPrompt.trim()}`,
        status: "pending",
        createdAt: Date.now(),
      };

      setTasks(prev => [newTask, ...prev]);

      // Начинаем отслеживание новой задачи
      pollTask(newTaskId);

    } catch (e) {
      setError((e as Error).message);
      console.error("Edit image error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="3" className="py-10">
      <Card className="glass-card p-6">
        <Flex align="center" justify="between">
          <Heading className="neon-text" size="6">
            Генерация изображений
          </Heading>
          <Badge color="blue" variant="soft">
            Midjourney
          </Badge>
        </Flex>
      </Card>

      {/* Отладочная панель */}
      <Card className="glass-card p-4 mt-4">
        <Heading size="3" className="mb-3">Отладочная информация</Heading>
        <div className="text-xs space-y-1">
          <div>Количество задач: {tasks.length}</div>
          <div>Статусы задач: {tasks.map(t => `${t.id}: ${t.status}`).join(', ') || 'нет'}</div>
          <div>Задачи с результатами: {tasks.filter(t => t.result).length}</div>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Панель генерации */}
        <Card className="glass-card p-6">
          <Heading size="4" className="mb-4">
            Создать изображение
          </Heading>
          
          <div className="space-y-4">
            <div>
              <Text size="2" className="block mb-2 text-gray-300">
                Описание изображения
              </Text>
              <TextArea
                rows={4}
                placeholder="Опишите изображение, которое хотите создать..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full"
              />
            </div>

            {error && (
              <Text color="red" size="2">{error}</Text>
            )}

            <Button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="w-full"
              size="3"
            >
              {loading ? "Генерация..." : "Создать изображение"}
            </Button>

            <Separator my="4" size="4" />

            <div className="text-sm text-gray-400">
              <Text size="2">
                💡 <strong>Советы:</strong>
              </Text>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Будьте конкретны в описании</li>
                <li>• Добавляйте стиль: "в стиле аниме", "фотореалистично"</li>
                <li>• Указывайте качество: "высокое качество", "детализированно"</li>
                <li>• Используйте параметры: --ar 16:9, --v 6</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* История задач */}
        <Card className="glass-card p-6">
          <Flex align="center" justify="between" className="mb-4">
            <Heading size="4">
              История генерации
            </Heading>
            <Button
              size="1"
              variant="outline"
              onClick={refreshAllTasks}
              disabled={loading || tasks.length === 0}
            >
              🔄 Обновить все
            </Button>
          </Flex>
          
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Text size="2" className="text-gray-400">
                Обновление задач...
              </Text>
            </div>
          )}
          
          {tasks.length === 0 ? (
            <Text className="text-gray-400">Пока нет созданных изображений</Text>
          ) : (
            <ScrollArea style={{ height: 500 }} type="always">
              <div className="space-y-3 pr-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-[color:var(--border)] rounded-md p-3"
                  >
                    <Flex align="center" justify="between" className="mb-2">
                      <Badge color={getStatusColor(task.status)} variant="soft">
                        {getStatusText(task.status)}
                        {task.progress && task.status === "processing" && (
                          <span className="ml-1">({task.progress})</span>
                        )}
                      </Badge>
                      <Text size="1" className="text-gray-400">
                        {new Date(task.createdAt).toLocaleString()}
                      </Text>
                    </Flex>
                    
                    <Text size="2" className="block mb-2">
                      {task.prompt}
                    </Text>

                    {task.result && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2 break-all">
                          URL: {task.result}
                        </div>
                        <div className="relative w-full aspect-square max-w-xs">
                          {/* Используем обычный img тег для большей гибкости */}
                          <img
                            src={task.result}
                            alt={task.prompt}
                            className="w-full h-full object-cover rounded border border-[color:var(--border)]"
                            onLoad={() => console.log("Image loaded successfully:", task.result)}
                            onError={async (e) => {
                              console.error("Image loading failed:", task.result, e);
                              const isValid = await checkImageUrl(task.result!);
                              console.log("Image URL validation result:", isValid);
                              
                              // Показываем сообщение об ошибке
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              const errorMsg = document.createElement('div');
                              errorMsg.className = 'absolute inset-0 flex items-center justify-center text-red-500 text-xs bg-red-50 rounded border border-red-200';
                              errorMsg.textContent = 'Не удалось загрузить изображение';
                              img.parentNode?.appendChild(errorMsg);
                            }}
                          />
                        </div>
                        <Flex gap="2" className="mt-2" wrap="wrap">
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => window.open(task.result, "_blank")}
                          >
                            Открыть
                          </Button>
                          <Button
                            size="1"
                            variant="outline"
                            onClick={() => refreshTask(task.id)}
                          >
                            Обновить
                          </Button>
                          <Button
                            size="1"
                            variant="outline"
                            onClick={async () => {
                              const isValid = await checkImageUrl(task.result!);
                              alert(isValid ? "Изображение доступно" : "Изображение недоступно");
                            }}
                          >
                            Проверить
                          </Button>
                          <Button
                            size="1"
                            variant="outline"
                            color="orange"
                            onClick={async () => {
                              const fixedUrl = await fixImageUrl(task.id);
                              if (fixedUrl) {
                                alert("URL изображения исправлен!");
                              } else {
                                alert("Не удалось найти рабочий URL");
                              }
                            }}
                          >
                            Исправить
                          </Button>
                          <Button
                            size="1"
                            variant="solid"
                            color="blue"
                            onClick={() => openEditModal(task.id)}
                          >
                            Редактировать
                          </Button>
                        </Flex>
                      </div>
                    )}

                    {task.error && (
                      <Text color="red" size="1" className="mt-2 block">
                        Ошибка: {task.error}
                      </Text>
                    )}

                    {task.buttons && task.buttons.length > 0 && (
                      <div className="mt-2">
                        <Text size="1" className="text-gray-400 mb-1">Доступные действия:</Text>
                        <div className="flex flex-wrap gap-1">
                          {task.buttons.map((button, index) => (
                            <Badge key={index} size="1" variant="outline">
                              {button.emoji} {button.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {task.properties && (
                      <div className="mt-2 text-xs text-gray-500">
                        <Text size="1">Task ID: {task.id}</Text>
                        {task.properties.messageHash && (
                          <Text size="1" className="block">Message Hash: {task.properties.messageHash}</Text>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>

      {/* Модальное окно для редактирования */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="glass-card p-6 max-w-md w-full mx-4">
            <Heading size="4" className="mb-4">
              Редактировать изображение
            </Heading>
            
            <div className="space-y-4">
              <div>
                <Text size="2" className="block mb-2 text-gray-300">
                  Описание изменений
                </Text>
                <TextArea
                  rows={3}
                  placeholder="Опишите, что вы хотите изменить в изображении..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="text-xs text-gray-400">
                <Text size="1">
                  💡 <strong>Советы по редактированию:</strong>
                </Text>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Будьте конкретны в описании изменений</li>
                  <li>• Укажите, какую часть изображения нужно изменить</li>
                  <li>• Опишите желаемый результат детально</li>
                </ul>
              </div>

              {error && (
                <Text color="red" size="2">{error}</Text>
              )}

              <Flex gap="3" justify="end">
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button
                  onClick={confirmEdit}
                  disabled={loading || !editPrompt.trim()}
                  color="blue"
                >
                  {loading ? "Редактирование..." : "Применить"}
                </Button>
              </Flex>
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
