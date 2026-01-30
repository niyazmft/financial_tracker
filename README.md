# FinTrack - Smart Financial Tracker

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Vue](https://img.shields.io/badge/Vue.js-3.x-4fc08d.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)](https://vitejs.dev/)

FinTrack is a comprehensive, modern personal finance management application. Built with **Vue 3** and **Node.js**, it provides an intuitive interface to track income, manage budgets, analyze spending trends, and monitor subscriptions—all in one place.

## 🚀 Features

- **Centralized Dashboard**: Unified view of your financial health with interactive balance forecasting.
- **Transaction Management**: Robust filtering, categorization, and smart import (CSV/JSON).
- **Intelligent Tagging**: Automate transaction categorization with custom rules.
- **Budget Manager**: Set monthly targets per category with real-time progress tracking.
- **Installment Plans**: Manage long-term payments with automatic schedule generation and rebalancing.
- **Subscription Tracker**: Identify and track recurring payments with smart suggestions from your transaction history.
- **Spending Analysis**: Deep-dive into spending patterns with category-based breakdowns and YoY trends.
- **Secure Auth & Analytics**: Powered by **Firebase Authentication** for secure sign-up and session management, and **Firebase Analytics** to track user interactions and improve the experience.
- **Smart Notifications**: Transactional emails for welcome messages and password resets (Dev-friendly with Ethereal).

## 📖 Core Concepts

Understanding how FinTrack processes your data helps you get the most out of the application.

### 🏷️ Transaction Categorization & Tagging
FinTrack uses a two-tier approach to organize your spending:
- **Manual Categories**: Every transaction is assigned to a category (e.g., "Groceries", "Salary"). Categories are either typed as `earning` or `spending`.
- **Intelligent Tagging Rules**: You can create custom rules (e.g., "If description contains 'Amazon', set category to 'Shopping'"). When you import transactions, these rules are applied automatically to save time.

### 💰 Monthly Income Estimation
The application automatically calculates your "Estimated Monthly Income" by averaging all `earning` category transactions from the last 6 months. This estimate is used as the baseline for your dashboard's balance forecasting.

### 📊 Budget Management
Budgets are set per category for a specific date range. FinTrack tracks your real-time spending against these targets.
- **Spent Amount**: Only negative transactions within the budget's category and date range are counted.
- **Visual Progress**: Progress bars turn from green to red as you approach or exceed your limits.

### 🕵️ Anomaly Detection
The system monitors your spending patterns to identify unusual activity:
- **Logic**: It compares recent transactions (last 30 days) against your historical average (90-day window) for each category.
- **Sensitivity**: If a transaction is `X` times higher than your average (where `X` is your sensitivity setting), it triggers an alert.

## 📸 Previews

| Dashboard | Transactions |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/267d59e3-f867-4332-a049-4492e007e287" width="400" /> | <img src="https://github.com/user-attachments/assets/191f56bb-6b1d-420d-8b4a-fd4616a46051" width="400" /> |

| Budget Manager | Spending Analysis |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/620b707f-ee50-4ed4-a11c-95bce0d8b002" width="400" /> | <img src="https://github.com/user-attachments/assets/9dceb379-edaf-4b79-a794-f5c97399f6b7" width="400" /> |

## 🏗️ Architecture & Dependencies

FinTrack follows a clean, modular architecture separating the frontend, backend, and infrastructure layers.

- **Frontend**: Vue 3 (Composition API), Pinia (State), PrimeVue (UI), Tailwind CSS.
- **Backend**: Node.js, Express.js (REST API).
- **Data Layer**: NocoDB (Low-code DB interface) on top of PostgreSQL.
- **Authentication & Analytics**: Firebase Admin SDK (Backend), Firebase Client SDK (Frontend).
- **Infrastructure**: Docker & PM2 configurations (located in `infrastructure/`).

## 🛠️ DevOps & Tooling

- **CI/CD Pipeline**: Automated testing (Mocha/Vitest) and build checks via **GitHub Actions**.
- **Logging**: Structured logging with **Winston**, supporting daily rotation and separate error logs.
- **Email Service**: **Nodemailer** with Handlebars templates. Uses **Ethereal** (fake SMTP) in dev for easy testing.
- **Testing**:
  - **Backend**: Mocha + Sinon + Supertest
  - **Frontend**: Vitest + Vue Test Utils

## 🤖 AI-Ready Development

FinTrack is designed to be AI-native and is fully compatible with the **Gemini CLI** and other AI-assisted development tools.

- **[GEMINI.md](GEMINI.md)**: This file contains the primary context, architectural protocols, and mandatory coding standards for AI agents. It ensures that any AI-generated code or refactoring remains consistent with the project's established patterns and design principles.
- **Protocol-Driven**: The codebase follows a strict service-layer architecture and TDD workflow, making it highly predictable and safe for automated interventions.

## 🗄️ Database Setup (NocoDB)

FinTrack utilizes NocoDB to manage its data. Ensure the following tables are set up in your NocoDB instance with these specific fields:

### Core Tables

1.  **bank\_statments (Transactions)**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `date`: Date
    *   `amount`: Number (Negative for expenses, positive for income)
    *   `bank`: Text
    *   `description`: Text
    *   `ref_no`: Text (Reference number for bank transactions)
    *   `categories_id`: Link to categories table
    *   `is_deleted`: Boolean

2.  **categories**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `category_name`: Text
    *   `type`: Text (e.g., 'spending', 'earning')
    *   `is_deleted`: Boolean

3.  **subscriptions**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `name`: Text
    *   `amount`: Number
    *   `currency`: Text (Default: 'TRY')
    *   `billing_cycle`: Text (e.g., 'monthly', 'weekly', 'bi-weekly')
    *   `status`: Text (e.g., 'Active', 'Inactive')
    *   `start_date`: Date
    *   `next_payment_date`: Date
    *   `auto_renewal`: Boolean
    *   `notes`: Long Text
    *   `categories_id`: Link to categories table

4.  **items**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `item_name`: Text
    *   `categories_id`: Link to categories table
    *   `is_deleted`: Boolean

### Financial Planning & Management

5.  **saving\_goals**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `goal_name`: Text
    *   `target_amount`: Number
    *   `priority`: Number (Integer)
    *   `target_date`: Date
    *   *(Note: `current_amount` is dynamically calculated by the application.)*

6.  **budget\_manager**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `target_amount`: Number
    *   `start_date`: Date
    *   `end_date`: Date
    *   `is_active`: Boolean
    *   `categories_id`: Link to categories table

7.  **installments\_per\_record**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `installment_payment`: Number
    *   `start_date`: Date
    *   `paid`: Boolean
    *   `items_id`: Link to items table
    *   `categories_id`: Link to categories table
    *   `is_deleted`: Boolean

8.  **tagging\_rules**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `keyword`: Text
    *   `type`: Text (e.g., 'contains')
    *   `categories_id`: Link to categories table

9.  **user\_settings**
    *   `Id`: Primary Key
    *   `user_id`: Text (User's Firebase UID)
    *   `name`: Text
    *   `email`: Text (Email format)
    *   `monthly_income_estimate`: Number
    *   `currency`: Text (e.g., 'TRY')
    *   `time_zone`: Text
    *   `warning_threshold`: Number
    *   `anomaly_detection_enabled`: Boolean
    *   `anomaly_detection_sensitivity`: Number
    *   `dismissed_warnings`: JSON
    *   `onboarding_completed`: Boolean

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Docker & Docker Compose
- A Firebase Project (for Auth & Analytics)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/niyazmft/financial_tracker.git
   cd financial_tracker
   ```

2. **Configuration**
   *   Copy the example environment file:
       ```bash
       cp .env.example .env
       ```
   *   Open `.env` and fill in your **Firebase** credentials and **NocoDB** tokens.
   *   Place your Firebase Service Account JSON file in the root directory (e.g., `service-account.json`).

3. **Development Workflow**
   This project uses a hybrid workflow: **Docker** handles the infrastructure (Database, NocoDB), while the **FinTrack App** runs locally on your machine for rapid development.

   ### Step 1: Start Infrastructure & Setup Database
   Spin up Postgres and NocoDB using Docker Compose:
   ```bash
   cd infrastructure/docker
   docker-compose up -d
   cd ../..
   ```
   *   **NocoDB Dashboard:** [http://localhost:8080](http://localhost:8080)

   #### 🗄️ Automatic Database Setup
   Instead of creating tables manually, run the automated setup script. This will create all necessary tables, columns, and relationships in your NocoDB project.

   1.  Login to NocoDB and create a new **Project/Base** (e.g., "FinTrack").
   2.  Get your **API Token** (My Settings -> API Tokens) and **Base ID** (Project Settings).
   3.  Update your `.env` file with `NOCODB_API_TOKEN` and `NOCODB_PROJECT_ID`.
   4.  Run the setup script from the root directory:
       ```bash
       pnpm run db:setup
       ```
       *Note: If the script detects existing tables, it will abort to prevent data loss. Use `pnpm run db:setup -- --force` to override this safeguard.*
    5.  The script will output the created **Table IDs**. Copy them into your `.env` file to finalize the configuration.

   #### 🛠️ Development Utility Scripts
   The following scripts are available in `backend/scripts/` to help with development and debugging:

   - **Seed Data**: Populates your database with realistic dummy data for testing.
     ```bash
     pnpm run db:seed -- <USER_ID>
     ```
   - **Check Data**: A diagnostic tool to verify the existence and integrity of a user's data.
     ```bash
     pnpm run db:check -- <USER_ID>
     ```
   - **Email Diagnostic**: Interactively verify your SMTP configuration by sending a test email.
     ```bash
     pnpm run test:email
     ```

   ### Step 2: Start the Application
   Run the frontend and backend locally from the root directory:
   ```bash
   # Install dependencies
   pnpm install

   # Development Mode (Hot Reload)
   pnpm run dev
   ```
   *   **FinTrack App:** [http://localhost:3000](http://localhost:3000)

   > **Note:** Ensure your `.env` file is configured with the correct `NOCODB_API_TOKEN` after you set up your NocoDB account in Step 1.

   ### 🚀 Production Deployment
   For production environments, the app is configured for process management via **PM2**. This ensures the application stays alive indefinitely and restarts automatically if it crashes.

   **Run with PM2:**
   ```bash
   pnpm run pm2:start
   ```

   **Key Benefits:**
   - **Process Monitoring**: Automatically restarts the server on crashes or system reboots.
   - **Background Management**: Runs the application as a background daemon.
   - **Log Management**: Centralized logs for both `stdout` and `stderr`.
   - **Zero-Downtime Reload**: (Available via `pm2 reload`) for seamless updates.

   *Note: Configuration is located in `infrastructure/ecosystem.config.js`.*

## 📡 API Endpoints

The backend provides a RESTful API. Key endpoints include:

- `GET /api/transactions` - Fetch transactions with filtering.
- `POST /api/transactions` - Create a new transaction.
- `GET /api/budgets/active` - Get currently active budgets.
- `GET /api/subscriptions` - List all subscriptions and recurring payments.
- `GET /api/cash-flow-forecast` - Get 30-day balance projection.

*Full API documentation is available in the codebase under `backend/routes`.*

## 🔧 Troubleshooting

- **NocoDB Connection Failed:** Ensure the `nocodb-app` container is healthy (`docker ps`) and that your `.env` `NOCODB_API_URL` matches the Docker port (default 8080).
- **Docker Paths:** All infrastructure files are located in `infrastructure/docker`. Commands should be run from that directory or use the absolute path.
- **Firebase Errors:** specific `service-account.json` errors usually mean the file is missing or the path in `.env` is incorrect.
- **Port Conflicts:** If port 3000 or 5432 is taken, update `infrastructure/docker/docker-compose.yml` or your local env.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 💎 Credits

This project was developed with the help of modern AI and design tools:
- **[Gemini CLI](https://github.com/google-gemini/gemini-cli)**: For autonomous coding, refactoring, and project management.
- **[Google Stitch](https://stitch.withgoogle.com/)**: For visual design and UI components.

## 📄 License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.