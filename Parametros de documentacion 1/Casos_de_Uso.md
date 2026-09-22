# Casos de Uso Extendido
**Proyecto:** Base de Operaciones Babel

## Caso de Uso UC-01: Enlistamiento del Activo (Registro)
**Actor Principal:** Nuevo Usuario (Recluta).  
**Propósito:** Registrar un nuevo usuario en el sistema inmersivo, asignar un idioma y crear su expediente en la base de datos PostgreSQL.

**Precondiciones:**
- El sistema web se encuentra en línea y conectado a la BD.
- El usuario ingresa a la Landing Page.

**Flujo Principal:**
1. El usuario visualiza el mensaje de advertencia estilo radar en la Landing Page.
2. El usuario hace clic en **"INICIAR ENLISTAMIENTO"**.
3. El sistema despliega el formulario "Expediente del Activo".
4. El usuario ingresa su *Callsign* (Nombre de usuario), Canal Encriptado (Contraseña), y selecciona el *Frente de Operación* (Ruso o Mandarín).
5. El usuario envía el formulario.
6. El Frontend envía una petición POST al servidor Express.
7. El Backend valida que el *Callsign* no exista en la tabla `Usuarios` (PostgreSQL).
8. El Backend encripta el Canal Encriptado (Hash).
9. El Backend inserta el nuevo registro en `Usuarios` e inicializa `ConfiguracionUsuario` y `Estadisticas`.
10. El sistema presenta una pantalla de "Alistamiento Aprobado" y redirige al usuario a la Base.

**Flujos Alternativos:**
- *7a. El Callsign ya está en uso:* El backend rechaza el registro. El sistema muestra: `"IDENTIFICADOR EN USO. El Departamento de Inteligencia rechaza duplicados."` Retorna al paso 4.
- *4a. Omisión de datos:* Si los campos están vacíos, el frontend evita el envío y marca los campos en rojo alerta.

**Postcondiciones:**
- Se crea la sesión del usuario.
- El usuario ingresa a la plataforma con rango "Recluta (Nivel 0)".

---

## Caso de Uso UC-02: Misión de Infiltración Táctica (Modo Decodificador)
**Actor Principal:** Activo en Observación o Rango Superior (Usuario registrado).  
**Propósito:** Completar una misión de aprendizaje donde el usuario debe llenar las letras faltantes en una frase, similar al juego del ahorcado.

**Precondiciones:**
- El usuario está autenticado y tiene Vidas ("Integridad de Cobertura") > 0.
- El usuario se encuentra en el módulo de "Despliegue - Misiones Tácticas".

**Flujo Principal:**
1. El usuario selecciona el desafío "El Decodificador".
2. El Backend consulta una frase de la tabla `Frases` en PostgreSQL acorde a su idioma objetivo y nivel.
3. El sistema registra el inicio de la misión en `DesafiosInfiltracion`.
4. El Frontend presenta la frase con letras/caracteres faltantes, el tiempo límite en una cuenta regresiva, y una "Pista" de inteligencia.
5. El usuario intenta ingresar las letras correctas.
6. El usuario acierta todos los caracteres faltantes antes de agotar el tiempo o el máximo de errores.
7. El sistema marca el desafío como Completado, otorga puntos de experiencia y actualiza las estadísticas.
8. Se notifica visualmente el éxito del descifrado.

**Flujos Alternativos:**
- *6a. Errores máximos alcanzados:* El usuario agota los intentos. El sistema descuenta 1 vida. Si las vidas llegan a cero, ocurre el **Castigo Táctico** (Pantalla negra) e inserta el registro en `HistorialGameOver`.
- *6b. Tiempo expirado:* La comunicación se "pierde". El sistema descuenta 1 vida.

**Postcondiciones:**
- Se guarda el rendimiento en la tabla `DesafiosInfiltracion`.
- Se evalúa si el usuario obtiene suficientes puntos para un ascenso de rango.
