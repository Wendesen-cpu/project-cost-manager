# Project Cost Manager - Enhanced

This is the **enhanced version** of the Project Cost Manager that combines:

✅ **Advanced features from the local version**:
- Project autocomplete in chat
- Bulk work log operations (`addBulkWorkLogs`, `updateBulkWorkLogs`)
- Duplicate work log removal (`deleteDuplicateWorkLogs`)
- Advanced system prompts with CRITICAL RULES
- Interactive project selection tool
- `/api/projects` endpoint for autocomplete
- Comprehensive message parsing

✅ **Cloud infrastructure from the cloud version**:
- Groq API (`llama-3.3-70b-versatile`) instead of local Ollama
- Cloud-optimized configuration
- 30-second timeout (instead of 60)
- Dependency updates to latest versions

## Key Differences

| Feature | Local | Cloud | Enhanced |
|---------|-------|-------|----------|
| **AI Provider** | Ollama (local) | Groq (cloud) | **Groq (cloud)** ✨ |
| **Advanced Tools** | ✅ Yes | ❌ No | **✅ Yes** ✨ |
| **Project Autocomplete** | ✅ Yes | ❌ No | **✅ Yes** ✨ |
| **Bulk Operations** | ✅ Yes | ❌ No | **✅ Yes** ✨ |

## Environment Setup

```bash
# Install dependencies
npm install

# Set up Prisma
npx prisma generate
npx prisma migrate dev

# Run development server
npm run dev

# Optional: For dual-instance deployment
INSTANCE_NAME=secondary npm run dev  # Builds to .next-secondary
```

## Environment Variables

```env
# Database
POSTGRES_PRISMA_URL=your_database_url
POSTGRES_URL_NON_POOLING=your_database_url

# Groq API
GROQ_API_KEY=your_groq_api_key

# Optional: Email notifications
GMAIL_USER=your_email
GMAIL_PASSWORD=your_app_password
```

## Deployment Strategy

This project is designed for:
- **Production cloud deployments** using Groq API
- **Full-featured AI assistant** with advanced tools and autocomplete
- **Scalable** with environment-based configuration

Use `INSTANCE_NAME=secondary` to run multiple instances on the same machine for testing.
