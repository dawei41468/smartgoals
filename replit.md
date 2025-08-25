# Overview

This is a SMART Goals application that helps users create, track, and manage their goals through an AI-powered breakdown system. The application follows the SMART(ER) framework (Specific, Measurable, Achievable, Relevant, Time-bound, Exciting, Reviewed) and automatically generates weekly milestones and daily tasks using Deepseek's API. Users can create goals through a guided wizard, get AI-generated breakdowns, and track their progress through an intuitive dashboard.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Component Structure**: Modular component architecture with shared UI components in `/components/ui/`

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **API Structure**: RESTful endpoints for goals, tasks, and AI breakdown generation
- **Middleware**: Custom logging middleware for API request tracking
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Hot reload setup with Vite integration for full-stack development

## Data Storage Solutions
- **Database**: PostgreSQL using Neon Database (serverless PostgreSQL)
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema**: Shared schema definitions between client and server using Zod
- **Fallback**: In-memory storage implementation for development/testing
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple

## Authentication and Authorization
- **Current State**: Demo mode with fixed user ID for development
- **Session Management**: Express sessions configured for PostgreSQL storage
- **Security**: Prepared for user authentication with username/password schema

## External Service Integrations
- **AI Service**: Deepseek API integration for goal breakdown generation
- **Model**: Uses deepseek-chat for generating weekly milestones and daily tasks
- **API Management**: Structured prompts for consistent AI responses with fallback error handling
- **Environment Variables**: Secure API key management through environment configuration

## Key Design Patterns
- **Shared Types**: Common TypeScript interfaces and Zod schemas shared between client and server
- **API Client**: Centralized API client with consistent error handling and response typing
- **Component Composition**: Reusable UI components following atomic design principles
- **Data Flow**: Unidirectional data flow with React Query managing server state
- **Separation of Concerns**: Clear separation between UI components, business logic, and data access layers

## Development Workflow
- **Monorepo Structure**: Single repository containing both client and server code
- **Build Process**: Separate build processes for frontend (Vite) and backend (esbuild)
- **Type Safety**: End-to-end TypeScript with shared type definitions
- **Development Server**: Integrated development setup with hot reload for both frontend and backend