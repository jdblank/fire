# Switching Between Projects

## Stopping Fire Project

### Step 1: Stop All Services
```bash
cd ~/fire
docker-compose down
```

This stops and removes:
- Containers (app, postgres, redis, logto, etc.)
- Network
- Keeps volumes (your data is safe)

### Step 2: Clean Up Orphaned Containers & Networks
```bash
# Remove stopped containers
docker container prune -f

# Remove unused networks
docker network prune -f

# Remove dangling images (optional - saves space)
docker image prune -f
```

### Step 3: Check What's Using Space
```bash
docker system df
```

Shows:
- Images
- Containers
- Volumes
- Build cache

### Step 4: Clean Up Unused Volumes (Optional - BE CAREFUL)
```bash
# List volumes
docker volume ls

# Remove ONLY orphaned volumes (not attached to any container)
docker volume prune -f

# To remove specific volume (if needed)
docker volume rm volume_name
```

**WARNING:** Don't remove named volumes like `fire_postgres_data` unless you want to delete the database!

---

## Starting New Project

### Directory Structure
```
~/projects/
├── fire/          ← Keep Fire here
└── new-project/   ← Your new project
```

### Quick Setup
```bash
# Create new project directory
cd ~
mkdir -p projects/new-project
cd projects/new-project

# Initialize
git init
# Your project setup here...
```

### In Cursor

1. **File** → **Open Folder** → Select `~/projects/new-project`
2. Cursor saves Fire's state automatically
3. Work on new project

---

## Switching Back to Fire

```bash
# Stop new project
cd ~/projects/new-project
docker-compose down

# Start Fire
cd ~/fire
docker-compose up -d

# Wait 30 seconds for services to start
# Access: http://app.fire.local:3000
```

### In Cursor
**File** → **Open Folder** → Select `~/fire`

---

## Clean State Commands

### Fire - Full Clean Restart
```bash
cd ~/fire
docker-compose down -v  # Removes volumes too - RESETS EVERYTHING
docker-compose up -d
# Fresh database, need to recreate users
```

### New Project - Full Clean Restart
```bash
cd ~/new-project
docker-compose down -v
docker-compose up -d
```

---

## Docker Maintenance

### Check Docker Resource Usage
```bash
# Overall usage
docker system df

# Detailed breakdown
docker system df -v
```

### Clean Everything (Nuclear Option)
```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker container prune -f

# Remove all unused images
docker image prune -a -f

# Remove all unused volumes
docker volume prune -f

# Remove all unused networks
docker network prune -f
```

**WARNING:** This removes EVERYTHING not currently running!

---

## Recommended Workflow

**Working on Fire:**
```bash
cd ~/fire
docker-compose up -d
# Open Fire in Cursor
```

**Switching to New Project:**
```bash
docker-compose down  # In Fire directory
cd ~/projects/new-project
docker-compose up -d
# Open new-project in Cursor
```

**Both use same ports** - no conflicts since only one runs at a time!

---

## Tips

- Always `docker-compose down` before switching
- Keep separate Git repos
- Name volumes clearly (fire_*, newproject_*)
- Use `docker ps` to see what's running
- Use `docker-compose logs` to debug issues

---

## Current Fire State

Before switching, Fire is:
- ✅ All code committed
- ✅ Production deployed
- ✅ Tests passing
- ✅ Ready to pause

Safe to shut down!

