# Supabase MCP Server Rules

При использовании Supabase MCP сервера, Kilo Code должен всегда указывать параметр 'tool_name' в вызовах инструментов.

## Основные принципы

1. При каждом вызове инструментов Supabase MCP сервера, необходимо явно указывать параметр 'tool_name' с корректным именем инструмента.

2. Используйте правильные имена инструментов, соответствующие документации Supabase:
   - `search_docs` - для поиска по документации
   - `list_tables` - для получения списка таблиц
   - `list_extensions` - для получения списка расширений
   - `list_migrations` - для получения списка миграций
   - `apply_migration` - для применения миграций
   - `execute_sql` - для выполнения SQL запросов
   - `get_logs` - для получения логов
   - `get_advisors` - для получения рекомендаций
   - `get_project_url` - для получения URL проекта
   - `get_anon_key` - для получения анонимного ключа
   - `generate_typescript_types` - для генерации TypeScript типов
   - `list_edge_functions` - для получения списка Edge функций
   - `get_edge_function` - для получения содержимого Edge функции
   - `deploy_edge_function` - для развертывания Edge функции
   - `create_branch` - для создания ветки
   - `list_branches` - для получения списка веток
   - `delete_branch` - для удаления ветки
   - `merge_branch` - для слияния ветки
   - `reset_branch` - для сброса ветки
   - `rebase_branch` - для ребейза ветки

3. При использовании инструментов всегда проверяйте, что параметр 'tool_name' указан корректно и соответствует одному из доступных инструментов.

4. Если инструмент требует дополнительных параметров, они должны быть указаны в соответствии с документацией.

## Примеры правильного использования

### Неправильно:
```xml
<use_mcp_tool>
<server_name>supabase</server_name>
<arguments>
{"query":"SELECT * FROM users"}
</arguments>
</use_mcp_tool>
```

### Правильно:
```xml
<use_mcp_tool>
<server_name>supabase</server_name>
<tool_name>execute_sql</tool_name>
<arguments>
{"query":"SELECT * FROM users"}
</arguments>
</use_mcp_tool>
```

## Цель правила

Это правило помогает избежать ошибок при использовании Supabase MCP сервера и обеспечивает корректное выполнение инструментов.