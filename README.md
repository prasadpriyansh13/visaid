# VisaID - Object Detection Dashboard

A modern, minimal web application that displays object detection data from an external ESP32 API hosted on Render.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (for styling)
- **Framer Motion** (for animations)

## Features

### Landing Page (`/`)
- Clean, modern form with Name, Email, and Phone fields
- Smooth animations on form submission
- Redirects to dashboard after successful submission

### Dashboard (`/dashboard`)
- **Real-time Polling**: Fetches detection data from external API every 5 seconds
- **Data Display**: Shows object label, confidence percentage, and bounding box coordinates
- **Smart Placeholder**: Automatically shows "No objects detected" if no data is received for 2 minutes
- **Smooth Animations**: Fade and slide animations when new data arrives
- **Confidence Bar**: Animated progress bar showing detection confidence

## Project Structure

```
visaid/
├── app/
│   ├── api/
│   │   └── users/
│   │       └── route.ts          # API route for saving user data
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page with polling logic
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page with form
├── .env.example                  # Example environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com/api/detection
```

Replace `https://your-api-url.onrender.com/api/detection` with your actual Render API endpoint.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## How It Works

### Polling Logic

The dashboard uses a polling mechanism to fetch data from the external API:

1. **Initial Fetch**: Data is fetched immediately when the dashboard loads
2. **Interval Polling**: Subsequent fetches occur every 5 seconds using `setInterval`
3. **Error Handling**: Failed requests are logged but don't stop the polling cycle

### Timeout & Placeholder Logic

The application tracks the timestamp of the last successful API response:

1. **Success Tracking**: When data is successfully fetched, `lastSuccessTimeRef` is updated with the current timestamp
2. **Timeout Check**: A separate interval checks every second if 2 minutes (120,000ms) have passed since the last success
3. **Placeholder Display**: If the timeout threshold is exceeded, the placeholder UI is shown with a subtle pulse animation
4. **Auto-Recovery**: When data resumes, the placeholder automatically disappears and the detection data is displayed

### API Response Format

The application expects the following JSON structure from the API:

```json
{
  "label": "eyeglasses",
  "confidence": 0.98,
  "bounding_box": {
    "x": 20,
    "y": 15,
    "width": 100,
    "height": 80
  }
}
```

## API Routes

### POST `/api/users`

Saves user information (name, email, phone) to the backend.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User data saved successfully"
}
```

Currently, this route logs the data to the console. In production, you would integrate with a database.

## Animations

The application uses Framer Motion for smooth animations:

- **Landing Page**: Fade-in and slide-up on mount
- **Form Button**: Scale animation on hover and tap
- **Dashboard Cards**: Fade and slide animations when data updates
- **Confidence Bar**: Smooth width transition
- **Placeholder**: Subtle pulse animation

## Styling

The application uses Tailwind CSS with:

- Modern, minimal design
- Dark mode support (via system preference)
- Responsive layout
- Subtle gradients and shadows
- Smooth transitions

## Notes

- The frontend does NOT modify the ESP32 API - it only consumes data
- All API calls are made from the client-side (browser)
- The polling continues even if errors occur
- The placeholder timeout is independent of error states

## Troubleshooting

### API URL Not Working

1. Verify your `.env.local` file has the correct `NEXT_PUBLIC_API_URL`
2. Ensure the API endpoint is accessible and returns the expected JSON format
3. Check browser console for CORS errors (the API must allow requests from your domain)

### No Data Showing

- Check that the API is running and accessible
- Verify the API response matches the expected format
- The placeholder will appear after 2 minutes of no successful responses

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check that TypeScript types are correct
- Verify Next.js version compatibility

