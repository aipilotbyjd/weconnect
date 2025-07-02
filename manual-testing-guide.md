# 🧪 WeConnect Manual Testing Guide

## ✅ **Cleaned Up Issues:**
- ❌ Removed duplicate old directories (`src/auth`, `src/workflows`, etc.)
- ❌ Fixed broken import paths for User entity
- ❌ Removed unused files in `src/core/infrastructure/database/entities/`
- ✅ Fixed registration DTO to use `firstName` and `lastName` instead of `name`

## 🚀 **How to Test WeConnect Manually**

### **1. Basic API Health Check**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000" -Method GET
```
Expected: `Hello World!`

### **2. View API Documentation**
Open your browser: `http://localhost:3000/api/docs`

### **3. Test Node Registry**
```powershell
# Get all nodes
Invoke-RestMethod -Uri "http://localhost:3000/nodes" -Method GET

# Get node groups  
Invoke-RestMethod -Uri "http://localhost:3000/nodes/groups" -Method GET

# Get specific node details
Invoke-RestMethod -Uri "http://localhost:3000/nodes/HttpRequest" -Method GET

# Filter nodes by group
Invoke-RestMethod -Uri "http://localhost:3000/nodes?group=communication" -Method GET
```

### **4. Test User Registration (FIXED!)**
```powershell
$user = @{ 
    firstName = "John"
    lastName = "Doe" 
    email = "john.doe@example.com"
    password = "password123" 
} | ConvertTo-Json

$newUser = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -Body $user -ContentType "application/json"
```

### **5. Test User Login**
```powershell
$login = @{ 
    email = "john.doe@example.com"
    password = "password123" 
} | ConvertTo-Json

$token = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" -Method POST -Body $login -ContentType "application/json"

# Save token for authenticated requests
$authToken = $token.accessToken
```

### **6. Test Workflow Creation (Authenticated)**
```powershell
$headers = @{ 
    "Authorization" = "Bearer $authToken"
    "Content-Type" = "application/json" 
}

$workflow = @{
    name = "Test Workflow"
    description = "A simple test workflow"
    definition = @{
        nodes = @(
            @{
                id = "start"
                type = "Start"
                position = @{ x = 100; y = 100 }
                parameters = @{ manualTrigger = $true }
            }
        )
        connections = @{}
    }
} | ConvertTo-Json -Depth 10

$newWorkflow = Invoke-RestMethod -Uri "http://localhost:3000/workflows" -Method POST -Body $workflow -Headers $headers
```

### **7. Test Available Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Health check | ❌ |
| GET | `/nodes` | List all nodes | ❌ |
| GET | `/nodes/groups` | List node groups | ❌ |
| GET | `/nodes/{name}` | Get specific node | ❌ |
| POST | `/auth/register` | Register user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| GET | `/workflows` | List workflows | ✅ |
| POST | `/workflows` | Create workflow | ✅ |
| GET | `/workflows/{id}` | Get workflow | ✅ |
| POST | `/executions/workflows/{id}/start` | Execute workflow | ✅ |
| GET | `/webhooks` | List webhooks | ✅ |
| POST | `/webhooks/workflows/{id}` | Create webhook | ✅ |

## 🎯 **Current Status**
- ✅ **Node Registry**: 7 nodes (Start, HTTP Request, Set, IF, Function, Gmail, Slack)
- ✅ **Authentication**: Registration and login working
- ✅ **Database**: PostgreSQL connected
- ✅ **API Documentation**: Available at `/api/docs`
- ✅ **Clean Architecture**: Properly structured modules
- ✅ **TypeScript**: Fully typed and building successfully

## 🧪 **Testing with Browser**
1. Open `http://localhost:3000/api/docs`
2. Use the Swagger UI to test all endpoints interactively
3. Register a user, login, and get an access token
4. Use the token to test authenticated endpoints

Your WeConnect application is now fully functional and clean! 🎉
