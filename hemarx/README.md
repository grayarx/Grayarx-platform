# Hemarx

Private just-in-time learning studio.

This is a personal tool. It is not a feature of any other product, is not branded for any other company, and must not be deployed on any other site.

## What it does

1. **Ask User** — the studio stops and asks you, one question at a time, before it builds anything. Thin answers get a follow-up. No assumed curriculum.
2. **Curriculum** — after Ask User completes, a spreadsheet of resources you can apply this week.
3. **Daily brief** — pull from a tight source list (podcasts, X, Instagram, newsletters, news) and write a 10-minute coffee brief. Noise, clickbait, and repeats are cut.
4. **Mirror Test** — paste source material and your explanation. Get graded for vague, wrong, or unclear.
5. **Book Architect** — research a public figure’s real body of work and outline a book from verified public content only. Ambiguous names ask you which person.

## Run

From this folder, with the parent workspace’s `node_modules` on `PATH`:

```bash
PATH=../node_modules/.bin:$PATH npm run dev
```

Opens on **http://127.0.0.1:5050**

Optional: set `OPENAI_API_KEY` for richer Mirror / Architect synthesis. The studio works without it.

## Tests

```bash
PATH=../node_modules/.bin:$PATH npm test
```
