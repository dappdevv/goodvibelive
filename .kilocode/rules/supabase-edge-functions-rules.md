# Supabase Edge Functions Rules

При написании Supabase Edge Functions следуйте этим правилам:

## Основные принципы

1. Используйте Web API и Deno's core API вместо внешних зависимостей (например, используйте fetch вместо Axios, WebSockets API вместо node-ws)

2. Если повторно используете утилиты между Edge Functions, добавляйте их в `supabase/functions/_shared` и импортируйте с помощью относительного пути. НЕ создавайте перекрестные зависимости между Edge Functions.

3. НЕ используйте bare specifiers при импорте зависимостей. Если нужно использовать внешнюю зависимость, убедитесь, что она начинается с `npm:` или `jsr:`. Например, `@supabase/supabase-js` должен быть записан как `npm:@supabase/supabase-js`.

4. Для внешних импортов всегда указывайте версию. Например, `npm:@express` должен быть записан как `npm:express@4.18.2`.

5. Для внешних зависимостей предпочтительно использовать импорт через `npm:` и `jsr:`. Минимизируйте использование импортов из `@deno.land/x`, `esm.sh` и `@unpkg.com`. Если у вас есть пакет из этих CDN, вы можете заменить hostname CDN на `npm:` specifier.

6. Также можно использовать Node built-in API. Для этого нужно импортировать их с использованием `node:` specifier. Например, для импорта Node process: `import process from "node:process"`. Используйте Node API когда находите пробелы в Deno API.

7. НЕ используйте `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"`. Вместо этого используйте встроенный `Deno.serve`.

8. Следующие переменные окружения (секреты) заранее заполнены в локальной и хостед Supabase среде. Пользователям не нужно устанавливать их вручную:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - SUPABASE_DB_URL

9. Для установки других переменных окружения (секретов) пользователи могут поместить их в env файл и запустить `supabase secrets set --env-file path/to/env-file`

10. Один Edge Function может обрабатывать несколько маршрутов. Рекомендуется использовать библиотеку вроде Express или Hono для обработки маршрутов, так как это легче для понимания и поддержки разработчиком. Каждый маршрут должен начинаться с `/function-name` чтобы они корректно маршрутизировались.

11. Операции записи в файлы РАЗРЕШЕНЫ ТОЛЬКО в директорию `/tmp`. Можно использовать Deno или Node File API.

12. Используйте статический метод `EdgeRuntime.waitUntil(promise)` для запуска долгих задач в фоне без блокировки ответа на запрос. НЕ предполагайте, что он доступен в контексте запроса/выполнения.

## Примеры шаблонов

### Простая функция Hello World

```tsx
interface reqPayload {
	name: string;
}

console.info('server started');

Deno.serve(async (req: Request) => {
	const { name }: reqPayload = await req.json();
	const data = {
		message: `Hello ${name} from foo!`,
	};

	return new Response(
		JSON.stringify(data),
		{ headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }}
		);
});
```

### Пример функции с использованием Node built-in API

```tsx
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import process from "node:process";

const generateRandomString = (length) => {
    const buffer = randomBytes(length);
    return buffer.toString('hex');
};

const randomString = generateRandomString(10);
console.log(randomString);

const server = createServer((req, res) => {
    const message = `Hello`;
    res.end(message);
});

server.listen(9999);
```

### Использование npm пакетов в функциях

```tsx
import express from "npm:express@4.18.2";

const app = express();

app.get(/(.*)/, (req, res) => {
    res.send("Welcome to Supabase");
});

app.listen(8000);
```

### Генерация эмбеддингов с использованием встроенного @Supabase.ai API

```tsx
const model = new Supabase.ai.Session('gte-small');

Deno.serve(async (req: Request) => {
	const params = new URL(req.url).searchParams;
	const input = params.get('text');
	const output = await model.run(input, { mean_pool: true, normalize: true });
	return new Response(
	JSON.stringify(
			output,
		),
		{
			headers: {
				'Content-Type': 'application/json',
				'Connection': 'keep-alive',
			},
		},
	);
});