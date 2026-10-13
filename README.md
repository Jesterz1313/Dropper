# Hypeddit

Smart Link и Download Gate для музыкальных релизов на Next.js, Tailwind CSS и Supabase.

## Запуск

```bash
npm run dev
```

Без настройки Supabase страница `/midnight-drive` показывает демо-релиз. Панель артиста находится по адресу `/admin`.

## Supabase

Добавьте в `.env.local` URL проекта и публичный anon/publishable key (не service-role key):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Приложение ожидает таблицу `releases` с полями `id`, `slug`, `title`, `artist`, `cover_url`, `spotify_url`, `apple_music_url`, `telegram_url`, `soundcloud_url`, `download_url`, `created_at`, а также таблицу `contacts` с полями `id`, `email`, `release_id`, `created_at`. Поле `contacts.release_id` должно ссылаться на `releases.id`.

Включите RLS и настройте политики Supabase: публичное чтение опубликованных релизов и добавление контакта для Download Gate; создание релизов и чтение контактов разрешайте только авторизованным администраторам. Создайте пользователя администратора в Supabase Auth. Панель `/admin` использует вход по email/паролю и проверяет разрешения запросами к базе; anon key не заменяет политики доступа.

Поля ссылок на платформы, обложки и файл могут быть `NULL`. Slug используется в URL `/<slug>`.
