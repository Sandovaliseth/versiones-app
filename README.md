# Proyecto Versiones

Sistema para automatizar releases:  
- **Backend**: Spring Boot + Flyway
- **Frontend**: React + Vite + TypeScript  
- **Orquestación**: infraestructura (Docker, CI/CD) y n8n (Docker)  
- **Certificación**: Python worker  

## Cómo levantar n8n
```bash
cd infra
copy .env.example .env   # editar credenciales
docker compose up -d

UI: http://localhost:5678

