# GreenCart — Full-stack E-commerce Project

GreenCart is a student-friendly, full-stack sustainable shopping demo built with **HTML, CSS, JavaScript, Node.js, Express and SQLite**.

## Features
- Responsive landing page and product grid
- Product search and category filters
- Shopping cart with quantity controls, remove, and browser persistence
- Checkout form with server-side validation
- Orders saved to SQLite database
- Demo admin order dashboard and status updates
- Sample products seeded automatically on first run

## Requirements
- Node.js 18 or later (Node.js 20 LTS recommended)
- Internet connection for Google Fonts and remote product photos

## Run on Windows
1. Download and extract `GreenCart_Ecommerce.zip`.
2. Install Node.js from https://nodejs.org/ if it is not already installed.
3. Open the extracted `GreenCart_Ecommerce` folder.
4. Click the folder address bar in File Explorer, type `cmd`, and press Enter.
5. In Command Prompt run:
   ```bash
   npm install
   ```
6. After installation completes, run:
   ```bash
   npm start
   ```
7. Open `http://localhost:3000` in Chrome.
8. Add products to the bag, enter demo delivery details, and place an order.
9. Click **Admin** at the bottom-right to view orders and update their statuses.

## Project structure
```text
GreenCart_Ecommerce/
├── package.json
├── server.js
├── greencart.db          # created automatically on first run
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```

## API endpoints
- `GET /api/products?q=&category=` — list/search products
- `GET /api/categories` — product categories
- `POST /api/orders` — validate and place an order
- `GET /api/orders` — list demo orders
- `PATCH /api/orders/:id/status` — update demo order status
- `GET /api/health` — health check

## Important limitations
- Checkout is a **demo order only**. It does not charge a card or integrate a payment provider.
- The demo admin API is unauthenticated so it is easy to explore in a college demonstration. **Do not deploy it publicly** without adding authentication, authorization, validation/rate limiting, and secure configuration.
- Product photos are remote URLs; replace them with locally licensed images for offline use.
- Prices, products and stock values are sample data.


## Deploy to Render (free demo)
1. Create a GitHub account at https://github.com/ and sign in.
2. Create a **new private repository** named `greencart-ecommerce` (or public if you want to share the code).
3. Upload the contents of this folder to the repository (upload files; do not upload `node_modules` or `greencart.db`).
4. Sign in at https://render.com/ using GitHub.
5. In Render, choose **New + → Blueprint**, connect the repository, and let Render detect `render.yaml`.
6. Start the deployment. When it finishes, open the `onrender.com` URL shown by Render.

**Demo hosting note:** Render's free web service has an ephemeral filesystem. The SQLite database and demo orders can reset after a restart/redeploy. For durable production data, use a persistent disk on a paid plan or move the database to a managed database service. This project is a demo and has no protected admin login or live payment integration.
