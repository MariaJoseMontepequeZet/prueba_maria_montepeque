# Recruitment API

API REST para gestionar postulaciones de candidatos a vacantes, con cálculo automático de puntaje y prioridad.

**Stack:** Node.js 18+ (módulos nativos `node:http`, `node:fs`, `node:test`) · MySQL 8

Única dependencia: `mysql2`, el driver necesario para conectar Node.js con MySQL, porque Node no incluye cliente MySQL. No se usan frameworks, validadores ni cargadores de entorno externos.

## Estructura

```
src/
├── config/          env.js (carga y valida .env) · db.js (pool + transacciones)
├── constants/       enums.js (valores permitidos)
├── controllers/     capa HTTP
├── http/            router, lectura de JSON, respuestas, validación y errores
├── repositories/    acceso a datos (SQL parametrizado)
├── services/        reglas de negocio y cálculo de puntaje
├── utils/           AppError
├── validators/      validación de entrada
├── routes.js
├── app.js           servidor node:http
└── server.js
tests/               pruebas del cálculo de puntaje y prioridad (node:test)
database.sql         estructura + datos de prueba
```

## Instalación

```bash
npm ci
cp .env.example .env
```

Editar `.env` con las credenciales locales de MySQL.

## Base de datos

```bash
mysql -u <usuario> -p --default-character-set=utf8mb4 < database.sql
```

Crea `recruitment_db` con 5 candidatos, 5 vacantes (la 5 en estado `CLOSED`) y 5 postulaciones para probar las reglas.

## Ejecución

```bash
npm start        # producción
npm run dev      # recarga automática
npm test         # pruebas automatizadas
```

## Endpoints

### POST /applications

```bash
curl -X POST http://localhost:3000/applications \
  -H "Content-Type: application/json" \
  -d '{"candidateId":3,"vacancyId":1,"source":"REFERRAL","coverLetter":"I have four years of experience building REST APIs with Node.js and SQL databases"}'
```

Respuesta `201` con la postulación creada (`score: 9`, `priority: TOP`, `status: RECEIVED`). `score` y `priority` no se aceptan en el cuerpo.

### GET /applications

```bash
curl http://localhost:3000/applications
curl "http://localhost:3000/applications?status=IN_REVIEW"
curl "http://localhost:3000/applications?status=RECEIVED&vacancyId=1"
```

Ordenado por `score` descendente y `createdAt` ascendente. Incluye nombre y correo del candidato y título de la vacante.

### PUT /applications/:id/status

```bash
curl -X PUT http://localhost:3000/applications/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_REVIEW"}'
```

## Códigos de respuesta

| Código | Caso |
|---|---|
| 200 | Consulta o actualización exitosa |
| 201 | Postulación creada |
| 400 | Datos inválidos, campos no permitidos o JSON mal formado |
| 404 | Candidato, vacante, postulación o ruta inexistente |
| 405 | Método no permitido en una ruta existente |
| 409 | Vacante cerrada, postulación duplicada, estado final o mismo estado |
| 413 | Cuerpo mayor a 100 KB |
| 415 | Cuerpo sin `Content-Type: application/json` |
| 500 | Error no controlado |

## Escenarios con los datos de prueba

| Solicitud | Resultado esperado |
|---|---|
| Candidato 3 → vacante 1, `REFERRAL`, carta del ejemplo | 201 · score 9 · TOP |
| Candidato 5 → vacante 1, `REFERRAL`, carta `"node"` | 201 · score 7 · TOP (aplica −2 por 3 postulaciones activas) |
| Candidato 2 → vacante 1 | 409 · rechazado hace 10 días |
| Candidato 4 → vacante 1 | 201 · rechazado hace 45 días |
| Cualquier candidato → vacante 5 | 409 · vacante cerrada |
| `PUT /applications/4/status` | 409 · estado final `REJECTED` |

## Decisiones técnicas

- **Solo Node.js y MySQL:** servidor, router con parámetros, lectura del cuerpo, validación y carga de `.env` implementados con módulos nativos.
- **Concurrencia:** la creación corre en una transacción que bloquea la fila del candidato (`SELECT ... FOR UPDATE`), así dos solicitudes simultáneas no pueden saltarse la regla de duplicidad ni el conteo de postulaciones activas.
- **Duplicidad:** una sola consulta busca postulaciones `RECEIVED`, `IN_REVIEW`, `HIRED` o `REJECTED` con menos de 30 días. La fecha de rechazo es `status_updated_at`, que no vuelve a cambiar porque los estados finales son inmutables.
- **Cambio de estado atómico:** el `UPDATE` solo afecta postulaciones activas; si no afecta filas se distingue entre inexistente (404), estado final (409) o mismo estado (409).
- **Puntaje:** lógica pura y aislada en `scoring.service.js`, sin dependencia de la base de datos, lo que permite probarla unitariamente. Las palabras clave se buscan como subcadena sin distinguir mayúsculas.
- **Integridad en BD:** `ENUM`, claves foráneas con `ON DELETE RESTRICT`, `UNIQUE` en correo, `CHECK` y enteros sin signo; el puntaje nunca puede ser negativo.
- **Zona horaria:** la sesión de BD trabaja en UTC y las fechas se devuelven en ISO 8601.
- **Seguridad:** consultas parametrizadas, configuración solo por variables de entorno y validación estricta de entrada.
