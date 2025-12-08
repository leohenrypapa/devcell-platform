# DevCell Platform – Roadmap

This roadmap outlines the planned improvements, major features, and long-term
vision for the DevCell Platform. It synthesizes requirements from operational
workflow needs, developer tooling gaps, and security-driven constraints that
DevCell is designed to address.

This roadmap is **living documentation** and evolves with every release.

---

# 🚀 Guiding Principles

The roadmap is shaped by four core objectives:

### **1. Local-first**
DevCell must run entirely without cloud access:
- Local LLMs  
- Embedded vector DB  
- Local file-based knowledgebase  

### **2. Modular architecture**
Each subsystem (Tasks, Projects, KB, Standups, Training) should remain
independently maintainable.

### **3. AI-native workflows**
LLM capabilities should support — not overshadow — human workflows.

### **4. Secure by default**
Support air-gapped environments, roles, project-level permissions, and predictable data flows.

---

# 🗺️ Near-Term Roadmap (0.6.x → 0.8.x)

## ✅ **0.6.x — Project Permissions + Training Enhancements**
**Current milestone.**  
Incorporates the major features from CHANGELOG:

### **Shipped**
- Project-level permissions (`project_members`)
- New project members API
- Backend services for membership logic
- Improved training ingestion & seed-task generator
- Knowledgebase cleanup & safer deletions
- Dashboard fixes & improved task filtering

### **In Progress**
- Membership-aware frontend filtering  
- UI for project member management  
- Training roadmap preview interface  
- KB document version handling

---

# 🔜 Short-Term Roadmap (Next 2–3 Releases)

## **1. Real-Time Standup & Task Sync**
Introduce WebSocket layer or Server-Sent Events:
- Real-time updates for tasks, project boards, and standups  
- Dashboard auto-refresh  
- “Currently typing” indicators for standups  

## **2. Enhanced Analytics & Metrics**
New analytics dashboards:
- Task velocity  
- Project burn-down  
- Standup frequency & activity heatmaps  
- Training progress  

## **3. Plugin Framework (Internal Extensions)**
Allow internal teams to create and register modules:
- Custom pages  
- Custom routes  
- Custom AI workflows  
- Mission-specific tools (e.g., malware dev labs, packet analysis help)

## **4. Inline Document Viewer for KB**
Preview PDF / Markdown / text directly in the Knowledgebase UI:
- No external viewer  
- Tight integration with RAG  

---

# 🌐 Medium-Term Roadmap (0.9.x → 1.2.x)

## **1. Multi-Tenant Support**
Separate:
- users  
- projects  
- knowledgebases  
- task spaces  

Useful for:
- large orgs  
- multi-team deployments  
- training centers  

## **2. Advanced RBAC (beyond project-level)**
Introduce more granular roles:
- `viewer`
- `contributor`
- `manager`
- `owner`  
- `admin` (global)

Module-specific policy rules:
- Tasks write-access  
- Standup read-access  
- KB visibility rules  

## **3. LLM Agent Extensions**
LLM agents that can perform:
- automated documentation generation  
- task suggestions  
- code base analysis  
- security pipeline transformations  

Also: background tasks with Celery or native async queues.

## **4. Mobile-Friendly Standup + Tasks**
Dedicated mobile layout or app-like PWA:
- Quick task updates  
- Easy standup input  
- Offline-first sync  

---

# 🛰️ Long-Term Vision (1.3.x and beyond)

## **1. Fully Self-Hosting Federated Model**
Distributed deployments:
- Each unit/team runs its own DevCell  
- Federated search (opt-in)  
- Cross-cell task or project sharing  

## **2. AI-Enhanced Developer Environment**
DevCell as a “local AI dev environment”:
- Inline code review  
- Static analysis  
- Test generation  
- Local prompt toolkit  
- Repository-aware feedback  

## **3. Knowledgebase Evolution**
Move from file-based to hybrid RDBMS + object store:
- Versioning  
- Branching  
- Collaboration  
- Time-travel querying  

## **4. Automated Org Training Pipelines**
Training module becomes a full LMS-lite:
- Courses  
- Lessons  
- Skill tracking  
- Automated task injection  
- Progress dashboards  

---

# 🎯 Philosophy of Future Development

DevCell will continue to prioritize:

- **Simplicity over complexity**  
- **Developer autonomy**  
- **Local-first AI**  
- **Modular evolution**  
- **Internal extensibility**  

DevCell is not meant to replace enterprise platforms like Jira or Confluence —  
it is meant to provide a **mission-focused**, **self-hosted**,  
**LLM-powered developer environment** for small units that must operate fast.

---

# 📚 Related Documents

- Overview → `overview/index.md`  
- Features → `overview/features.md`  
- Architecture → `architecture/*`  
- Modules → `modules/*`  
- APIs → `api/*`  

---

```

© DevCell Platform Documentation — GitHub OSS Style

```