# Fundamentos de inteligencia artificial

## Pregunta 1. Integración de extracción de habilidades con IA

1. **Catálogo y requisitos en BD:** tablas `skills` (catálogo oficial), `vacancy_skills` (habilidades requeridas por vacante, con peso u obligatoriedad) y `application_skills` (habilidades detectadas, confianza, versión del modelo y del prompt).
2. **Procesamiento asíncrono:** `POST /applications` sigue respondiendo con las reglas actuales y publica un evento en una cola. Un worker invoca al modelo fuera del ciclo de la petición, evitando latencia y caídas del proveedor en el registro.
3. **Contrato de salida:** el prompt incluye el catálogo permitido y exige JSON estructurado (`{ "skills": [{ "name", "confidence" }] }`), usando *structured outputs* o *tool calling* cuando el proveedor lo soporte. La carta se envía como dato delimitado, nunca como instrucción, para mitigar *prompt injection*.
4. **Comparación determinística:** el backend, no el modelo, cruza las habilidades validadas con `vacancy_skills` y calcula un porcentaje de coincidencia. Ese valor se expone en la API como señal adicional o como una regla más con peso acotado.
5. **Abstracción del proveedor:** un `SkillExtractor` (interfaz) desacopla el servicio del modelo concreto, facilita pruebas con *mocks* y permite cambiar de proveedor.
6. **Operación:** timeouts, límites de uso, registro de costo y latencia, sin enviar datos personales innecesarios (nombre, correo) al modelo.

## Pregunta 2. Respuestas inválidas o habilidades fuera del catálogo

- **Nunca confiar en la salida:** validar con un esquema (Zod) antes de usarla. Si el JSON es inválido, reintentar un número limitado de veces con *backoff*; si persiste, marcar el análisis como `FAILED`, registrar el error y continuar solo con las reglas determinísticas. La postulación nunca se pierde ni se bloquea.
- **Normalizar contra el catálogo:** minúsculas, sinónimos y alias (`nodejs` → `Node.js`). Lo que no exista en el catálogo se descarta del cálculo y se guarda aparte para que un humano decida si amplía el catálogo; el modelo no puede crear habilidades.
- **Umbral de confianza:** descartar o marcar para revisión las habilidades con confianza baja.
- **Idempotencia y trazabilidad:** guardar respuesta cruda, versión del modelo y del prompt para auditar y reprocesar.
- **Monitoreo:** métricas de tasa de error y de habilidades desconocidas; un aumento indica cambios en el modelo o en el prompt. Si la falla es masiva, un *circuit breaker* desactiva temporalmente la integración.

## Pregunta 3. ¿Reemplazar las reglas determinísticas por IA?

No. La decisión afecta el acceso de personas a un empleo y debe ser explicable, auditable y justa:

- **Explicabilidad:** con reglas se puede justificar cada punto del puntaje; un modelo no ofrece una explicación verificable.
- **Reproducibilidad:** un modelo puede dar resultados distintos para la misma entrada o cambiar al actualizarse; las reglas producen siempre el mismo resultado y se prueban con pruebas automatizadas.
- **Sesgos:** los modelos pueden reproducir sesgos de sus datos (género, edad, origen, redacción o idioma) y es difícil detectarlos o corregirlos.
- **Regulación:** la selección de personal se considera un uso de alto riesgo en marcos como el AI Act europeo, que exige supervisión humana, transparencia y gestión de riesgos.
- **Robustez:** la carta es texto libre del candidato y puede manipular al modelo (*prompt injection*).

El enfoque adecuado es híbrido: las reglas determinísticas siguen como base, la IA aporta una señal adicional con peso limitado y visible, y la decisión final queda en el reclutador, con monitoreo de sesgos y registro de cada recomendación.
