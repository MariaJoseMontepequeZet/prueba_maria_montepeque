# Historial de uso de IA

Herramienta: Claude (Anthropic) · claude.ai

## Solicitud

Se compartió el enunciado de la prueba diagnóstica y se pidió actuar como desarrollador senior para construir la API REST de postulaciones con Node.js y MySQL, aplicando buenas prácticas de estructura, ramas y código, con comandos de terminal listos para usar.

## Respuesta del asistente

- Propuso la arquitectura por capas (routes → controllers → services → repositories).
- Primera versión con Express, Zod y dotenv; tras la observación de usar únicamente Node.js y MySQL se reescribió con módulos nativos, dejando solo `mysql2` como driver.
- Diseñó `database.sql` con restricciones, claves foráneas, índices y datos de prueba.
- Implementó el cálculo de puntaje como función pura con pruebas en `node:test`.
- Implementó la regla de duplicidad y el cambio de estado protegidos contra concurrencia.
- Redactó README.md y RESPUESTAS.md.
- Verificó los endpoints contra una base de datos real antes de la entrega.

> Adjuntar a continuación la exportación completa de la conversación.
