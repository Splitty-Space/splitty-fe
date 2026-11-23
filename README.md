This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

This project uses npm and Node 24 (see `.nvmrc`). Install dependencies and run the development server:

```bash
npm ci
npm run dev
```

Before opening a pull request, run the same checks CI runs:

```bash
npm run lint
npm run typecheck
npm test
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

In `next dev` the Telegram environment is mocked, so the app opens in a plain browser. To try a production build in a plain browser, run:

```bash
npm run start:local
```

It builds with the Telegram mock turned on and starts the app on [http://localhost:3000](http://localhost:3000). The mock signs in only on a local backend, the same one `next dev` uses. This build is for local use only: deploy with `npm run build`, which never includes the mock.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
