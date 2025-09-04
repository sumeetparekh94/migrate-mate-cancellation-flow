# Migrate Mate - Subscription Cancellation Flow

## Overview

This is a subscription cancellation flow application for Migrate Mate built with Next.js, TypeScript, and Tailwind CSS. The application provides a comprehensive cancellation journey that includes:

- **Progressive cancellation flow** with multiple screens to guide users through the cancellation process
- **A/B testing functionality** with two variants (A: no downsell, B: $10 off offer)
- **Data persistence** using Supabase for storing cancellation records and user interactions
- **Responsive design** that works seamlessly on both mobile and desktop devices
- **Security features** input validation and not exposing/using the supabase anon key

The cancellation flow allows users to cancel their subscription while providing opportunities to retain them through targeted offers and reason collection for business insights.

## Steps to Run the Code

1. **Clone the repository**
   ```bash
   git clone https://github.com/sumeetparekh94/migrate-mate-cancellation-flow.git
   cd migrate-mate-cancellation-flow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add the environment variables provided in the email attachment.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   Navigate to `http://localhost:3000` in your browser to view the cancellation flow application.
