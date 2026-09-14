# Leword

**Build a vocabulary habit.** Save the words you run into while watching a movie or reading a book, and keep coming back until you actually know them.

The idea is simple. You hear a word you don't know. You save it — along with the sentence you heard it in and where it came from. Leword keeps it in your personal word bank, shows you one word a day, and gives you flashcards to drill the ones you haven't mastered yet. Your streak counts the days you kept it up.

## What it does

- **Your word bank** — every word you save, with its definition, the sentence you heard it in, the movie or book it came from, and a memory hook. Search it, filter it by category, and tick words off as mastered.
- **Word of the Day** — one word from your own list, picked fresh each day, always one you haven't mastered.
- **Flashcards** — flip a card to reveal the meaning. A parrot squawks each time you flip.
- **Streak and stats** — how many days in a row you've added a word, how many words you have, and what share of them you've mastered.
- **Hear it out loud** — tap the speaker on any word and your browser pronounces it, with a parrot mascot that moves while it talks.
- **Sign in** — with Google, or with an email and password.
- **Install it** — works as an app on your phone or desktop, in light or dark mode.

## Built with

| | |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS v4 · shadcn/ui (`base-nova`) · Base UI · lucide-react |
| Sign-in and database | Supabase |
| Extras | sonner (toasts) · next-themes · Lufga (local font) |
| Package manager | pnpm |

## Getting started

### 1. Install the dependencies

```bash
pnpm install
```

### 2. Add your environment variables

Create a file called `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
GEMINI_API_KEY=<your-key>

# Optional. The address Google sends people back to after sign-in.
# It falls back to whatever origin the app is running on, so you only
# need this for preview deployments or when running behind a proxy.
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

`GEMINI_API_KEY` is used only on the server. Don't rename it with a `NEXT_PUBLIC_` prefix — that would expose it to the browser.

### 3. Set up the database

In your Supabase project, open the SQL editor and run:

```sql
create table public.words (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  word             text not null,
  part_of_speech   text,
  definition       text not null,
  context_sentence text,
  source           text,
  category         text default 'General',
  mnemonic         text,
  is_mastered      boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.words enable row level security;

create policy "Users manage their own words"
  on public.words for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

That last policy is what keeps one person's words private from everyone else's. The app talks to Supabase from the browser using the public anon key, so without it, anyone could read the whole table. Don't skip it.

For Google sign-in, go to **Authentication → Providers** in Supabase, turn on Google, and add your site's address to the list of allowed redirect URLs.

### 4. Start it up

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the app locally with live reload |
| `pnpm build` | Builds it for production |
| `pnpm start` | Serves the production build |
| `pnpm lint` | Checks the code with ESLint |

## Where things live

```
app/
  page.tsx           The dashboard — word bank, search, filters, stats
  auth/page.tsx      Sign in and sign up
  layout.tsx         The page shell and providers
  manifest.ts        Settings for installing the app
  fonts/             The Lufga font files

components/
  AddWordDialog      The form for saving a new word
  WordCard           A single word in the grid
  WordOfTheDay       Today's pick
  FlashcardModal     Flip-to-reveal practice
  HabitStats         Streak, totals, mastery
  Parrot             The mascot, and the hook that tracks speech
  ui/                Buttons, dialogs, inputs, and other shared pieces

context/
  AuthContext.tsx    Keeps track of who's signed in

lib/
  supabase.ts        Talks to Supabase from the browser
  auth-server.ts     Checks a user's token on the server
  dictionary.ts      Pronunciation
  rate-limit.ts      Caps how often one person can hit the server
  chirp.ts           The parrot sound on card flips
```

## Good to know

- The Lufga font files in `app/fonts/Demo_Fonts/` are a **trial version**. Buy a licence before putting this in front of real users.
- `.env.local` is ignored by git, so your keys stay out of the repository. If a key has ever been shared or committed, replace it.
