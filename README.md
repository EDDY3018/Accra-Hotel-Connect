# AccraHostelConnect

AccraHostelConnect is a comprehensive, full-stack web application designed to streamline the hostel booking and management process for students and hostel managers in Accra, Ghana. It provides a seamless, user-friendly experience for browsing rooms, handling bookings, managing payments, and facilitating communication.

## Core Features

### For Students
- **Room Browsing:** Search and filter available rooms with detailed descriptions, high-quality photos, and a list of amenities.
- **Secure Booking:** Book a room securely through the online portal and receive instant confirmation.
- **Dashboard:** A personalized dashboard to view current room details, outstanding payment balances, and important announcements.
- **Payment History:** Track all past and pending payments with a clear and concise history log.
- **Support System:** Submit support tickets for maintenance issues or other complaints and track the status of your requests.
- **AI-Powered Chatbot:** Get instant answers to common questions about the hostel, bookings, and payments through a friendly AI assistant.

### For Hostel Managers
- **Admin Dashboard:** Get a comprehensive overview of your hostel's operations with key metrics like occupancy rates, new bookings, and open support tickets, visualized with charts.
- **Room Management:** Easily add, edit, and manage rooms, including details, pricing, photos, and availability status.
- **Booking Management:** View and manage all student bookings, with the ability to confirm payments and update booking statuses.
- **Student Management:** Keep a directory of all students, view their booking details, and track their payment status.
- **Announcements:** Create and publish announcements to all students residing in the hostel.
- **Support Ticket Management:** View, respond to, and manage support tickets submitted by students.
- **Cancellation Tracking:** Review booking cancellations and the reasons provided by students.
- **AI-Generated Legal Documents:** Generate standard legal documents like a Privacy Policy or Terms of Service using AI.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (using the App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database:** [Firebase](https://firebase.google.com/)
  - **Authentication:** Firebase Auth for secure user sign-up and login.
  - **Database:** Cloud Firestore for real-time data storage.
  - **File Storage:** Firebase Storage for hosting room images.
  - **Emailing:** Firebase "Trigger Email" extension for automated booking confirmations.

## AI Integration

This application leverages **Google's Genkit** to power its intelligent features:

- **Student Chatbot:** A conversational AI, built with Genkit and a Google AI model (Gemini), assists students with their queries.
- **Legal Document Generation:** Genkit is used to generate standardized legal documents based on the application's context, saving administrative time and effort.
