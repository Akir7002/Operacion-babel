# 📘 Guía Completa: Conectar Página Frontend a Backend y BD

**Fecha:** 25/05/2026  
**Proyecto:** Operación Babel  
**Estado:** ✅ Operativo

---

## 📋 Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Verificar Estructura de BD](#paso-1-verificar-estructura-de-bd)
3. [Paso 2: Insertar Datos de Prueba](#paso-2-insertar-datos-de-prueba)
4. [Paso 3: Conectar POST /api/reclutas](#paso-3-conectar-post-apireclutas)
5. [Paso 4: Verificar Backend (GET /api/mazos)](#paso-4-verificar-backend-get-apimazos)
6. [Paso 5: Arreglar CSS](#paso-5-arreglar-css)
7. [Paso 6: Arreglar Lógica de Filtros](#paso-6-arreglar-lógica-de-filtros)
8. [Comandos Útiles](#comandos-útiles)

---

## Requisitos Previos

Asegúrate de tener:
- ✅ **Node.js** instalado
- ✅ **pnpm** instalado (`npm install -g pnpm`)
- ✅ **SQL Server** corriendo con base de datos `OperacionBabel`
- ✅ Variables de entorno configuradas en `.env`

```env
DB_USER=sa
DB_PASSWORD=OperacionBabel2026!
DB_SERVER=localhost
DB_DATABASE=OperacionBabel
DB_PORT=1433
PORT=3000
```

---

## Paso 1: Verificar Estructura de BD

### 1.1 Crear script de debug
Crea el archivo `debug-mazos.js`:

```javascript
// Script de debug para probar la conexión y las querys
const { getConnection, sql } = require('./db');
require('dotenv').config();

async function debugMazos() {
    try {
        console.log('🔍 Iniciando debug de mazos...\n');
        
        const pool = await getConnection();
        
        // Verificar si existen las tablas
        console.log('1️⃣  Verificando tablas existentes...');
        const tables = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE='BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        console.log('Tablas disponibles:');
        tables.recordset.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
        
        // Verificar estructura de MazosFlashcards
        console.log('\n2️⃣  Verificando estructura de MazosFlashcards...');
        const mazosColumns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'MazosFlashcards'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Columnas:');
        mazosColumns.recordset.forEach(c => {
            console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE}, nullable: ${c.IS_NULLABLE})`);
        });
        
        // Verificar estructura de Flashcards
        console.log('\n2.5️⃣  Verificando estructura de Flashcards...');
        const flashcardsColumns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Flashcards'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Columnas:');
        flashcardsColumns.recordset.forEach(c => {
            console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE}, nullable: ${c.IS_NULLABLE})`);
        });
        
        // Verificar estructura de Diccionario
        console.log('\n2.6️⃣  Verificando estructura de Diccionario...');
        const diccionarioColumns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Diccionario'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Columnas:');
        diccionarioColumns.recordset.forEach(c => {
            console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE}, nullable: ${c.IS_NULLABLE})`);
        });
        
        // Contar registros
        console.log('\n3️⃣  Contando registros...');
        const count = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM MazosFlashcards) as TotalMazos,
                (SELECT COUNT(*) FROM Flashcards) as TotalFlashcards,
                (SELECT COUNT(*) FROM Diccionario) as TotalItems
        `);
        console.log(`Total de Mazos: ${count.recordset[0].TotalMazos}`);
        console.log(`Total de Flashcards: ${count.recordset[0].TotalFlashcards}`);
        console.log(`Total de Items: ${count.recordset[0].TotalItems}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error crítico:', error.message);
        process.exit(1);
    }
}

debugMazos();
```

### 1.2 Ejecutar debug
```bash
cd "C:\Users\maria\OneDrive\Documents\Trabajitos\Humano computador\Operaciones babel"
pnpm node debug-mazos.js
```

**Salida esperada:**
```
Total de Mazos: 0
Total de Flashcards: 0
Total de Items: 0
```

Si hay 0 en todos, necesitas insertar datos → Paso 2

---

## Paso 2: Insertar Datos de Prueba

### 2.1 Crear script de semilla
Crea el archivo `seed-data.js`:

```javascript
// Script para insertar datos de prueba en la BD
const { getConnection, sql } = require('./db');
require('dotenv').config();

async function seedData() {
    try {
        console.log('🌱 Sembrando datos de prueba en OperacionBabel...\n');
        
        const pool = await getConnection();
        
        // 1. Insertar Mazos de Flashcards
        console.log('1️⃣  Insertando Mazos de Flashcards...');
        const mazosInsert = await pool.request()
            .input('NombreMazo1', sql.NVarChar, 'Alfabeto Ruso Básico')
            .input('Desc1', sql.NVarChar, 'Aprende el alfabeto cirílico desde cero')
            .input('Orden1', sql.Int, 1)
            
            .input('NombreMazo2', sql.NVarChar, 'Vocabulario Militar Ruso')
            .input('Desc2', sql.NVarChar, 'Términos militares esenciales en ruso')
            .input('Orden2', sql.Int, 2)
            
            .input('NombreMazo3', sql.NVarChar, 'Frases Tácticas Mandarín')
            .input('Desc3', sql.NVarChar, 'Frases de comando y comunicación en chino')
            .input('Orden3', sql.Int, 3)
            
            .input('NombreMazo4', sql.NVarChar, 'Caracteres Chinos Avanzados')
            .input('Desc4', sql.NVarChar, 'Caracteres complejos del mandarín')
            .input('Orden4', sql.Int, 4)
            .query(`
                INSERT INTO MazosFlashcards (IdIdioma, IdCategoria, IdNivel, NombreMazo, Descripcion, OrdenVisual, Activo)
                VALUES 
                    (1, 1, 1, @NombreMazo1, @Desc1, @Orden1, 1),
                    (1, 2, 2, @NombreMazo2, @Desc2, @Orden2, 1),
                    (2, 3, 1, @NombreMazo3, @Desc3, @Orden3, 1),
                    (2, 4, 3, @NombreMazo4, @Desc4, @Orden4, 1);
            `);
        
        console.log('✅ Mazos insertados');
        
        // 1.5. Insertar items en la tabla Diccionario
        console.log('\n1️⃣ .5️⃣  Insertando items en Diccionario...');
        const itemsInsert = await pool.request().query(`
            INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, TraduccionEspanol, Activo)
            VALUES 
                -- Ruso (IdIdioma = 1)
                (1, 1, 1, 'А', 'Primera letra del alfabeto ruso', 1),
                (1, 1, 1, 'Б', 'Segunda letra', 1),
                (1, 1, 1, 'В', 'Tercera letra', 1),
                (1, 1, 1, 'Г', 'Cuarta letra', 1),
                (1, 1, 1, 'Д', 'Quinta letra', 1),
                (1, 2, 2, 'Боец', 'Soldado', 1),
                (1, 2, 2, 'Оружие', 'Arma', 1),
                (1, 2, 2, 'Задание', 'Misión', 1),
                -- Mandarín (IdIdioma = 2)
                (2, 3, 1, '早上好', 'Buenos días', 1),
                (2, 3, 1, '再见', 'Adiós', 1),
                (2, 3, 1, '谢谢', 'Gracias', 1),
                (2, 4, 3, '龍', 'Dragón', 1),
                (2, 4, 3, '國', 'Nación', 1);
        `);
        console.log('✅ Items insertados en Diccionario');
        
        // 2. Obtener los IDs de los mazos
        console.log('\n2️⃣  Obteniendo IDs de mazos...');
        const mazos = await pool.request().query(`
            SELECT TOP 4 IdMazo FROM MazosFlashcards ORDER BY IdMazo DESC
        `);
        
        const mazoIds = mazos.recordset.map(m => m.IdMazo);
        console.log(`Mazos creados con IDs: ${mazoIds.join(', ')}`);
        
        // 2.5. Obtener los IDs de los items del diccionario
        console.log('\n2️⃣ .5️⃣  Obteniendo IDs de items...');
        const items = await pool.request().query(`
            SELECT TOP 13 IdItem FROM Diccionario ORDER BY IdItem DESC
        `);
        
        const itemIds = items.recordset.map(i => i.IdItem).reverse();
        console.log(`Items creados con IDs: ${itemIds.join(', ')}`);
        
        // 3. Insertar Flashcards
        console.log('\n3️⃣  Insertando Flashcards de prueba...');
        if (mazoIds.length > 0 && itemIds.length >= 13) {
            const flashcardsInsert = await pool.request()
                .input('IdMazo1', sql.Int, mazoIds[0])
                .input('IdMazo2', sql.Int, mazoIds[1])
                .input('IdMazo3', sql.Int, mazoIds[2])
                .input('IdMazo4', sql.Int, mazoIds[3])
                .input('Item1', sql.Int, itemIds[0])
                .input('Item2', sql.Int, itemIds[1])
                .input('Item3', sql.Int, itemIds[2])
                .input('Item4', sql.Int, itemIds[3])
                .input('Item5', sql.Int, itemIds[4])
                .input('Item6', sql.Int, itemIds[5])
                .input('Item7', sql.Int, itemIds[6])
                .input('Item8', sql.Int, itemIds[7])
                .input('Item9', sql.Int, itemIds[8])
                .input('Item10', sql.Int, itemIds[9])
                .input('Item11', sql.Int, itemIds[10])
                .input('Item12', sql.Int, itemIds[11])
                .input('Item13', sql.Int, itemIds[12])
                .query(`
                    INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, CaraFrontal, CaraTrasera, TipoFlashcard)
                    VALUES 
                        -- Mazo 1: Alfabeto Ruso
                        (@IdMazo1, @Item1, 1, 'А (Mayúscula)', 'Primera letra del alfabeto ruso', 'Letra'),
                        (@IdMazo1, @Item2, 2, 'Б', 'Segunda letra', 'Letra'),
                        (@IdMazo1, @Item3, 3, 'В', 'Tercera letra', 'Letra'),
                        (@IdMazo1, @Item4, 4, 'Г', 'Cuarta letra', 'Letra'),
                        (@IdMazo1, @Item5, 5, 'Д', 'Quinta letra', 'Letra'),
                        
                        -- Mazo 2: Vocabulario Militar Ruso
                        (@IdMazo2, @Item6, 1, '¿Cómo se dice "soldado" en ruso?', 'Боец', 'Palabra'),
                        (@IdMazo2, @Item7, 2, '¿Cómo se dice "arma" en ruso?', 'Оружие', 'Palabra'),
                        (@IdMazo2, @Item8, 3, '¿Cómo se dice "misión" en ruso?', 'Задание', 'Palabra'),
                        
                        -- Mazo 3: Frases Mandarín
                        (@IdMazo3, @Item9, 1, '¿Cómo se dice "buenos días" en chino?', '早上好 (Zǎoshang hǎo)', 'Frase'),
                        (@IdMazo3, @Item10, 2, '¿Cómo se dice "adiós" en chino?', '再见 (Zàijiàn)', 'Frase'),
                        (@IdMazo3, @Item11, 3, '¿Cómo se dice "gracias" en chino?', '谢谢 (Xièxie)', 'Frase'),
                        
                        -- Mazo 4: Caracteres Avanzados
                        (@IdMazo4, @Item12, 1, '龍 (dragón)', 'Carácter de dragón en escritura tradicional', 'Carácter'),
                        (@IdMazo4, @Item13, 2, '國 (nación)', 'Carácter de nación en escritura tradicional', 'Carácter');
                `);
            
            console.log('✅ Flashcards insertadas');
        }
        
        // 4. Verificar
        console.log('\n4️⃣  Verificando datos insertados...');
        const count = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM MazosFlashcards) as TotalMazos,
                (SELECT COUNT(*) FROM Flashcards) as TotalFlashcards
        `);
        
        console.log(`📊 Datos actuales:`);
        console.log(`   - Total de Mazos: ${count.recordset[0].TotalMazos}`);
        console.log(`   - Total de Flashcards: ${count.recordset[0].TotalFlashcards}`);
        
        console.log('\n✅ ¡Datos de prueba insertados exitosamente!\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

seedData();
```

### 2.2 Ejecutar seed
```bash
pnpm node seed-data.js
```

**Salida esperada:**
```
✅ Mazos insertados
✅ Items insertados en Diccionario
✅ Flashcards insertadas
📊 Datos actuales:
   - Total de Mazos: 4
   - Total de Flashcards: 13
✅ ¡Datos de prueba insertados exitosamente!
```

---

## Paso 3: Conectar POST /api/reclutas

### 3.1 Verificar endpoint en `index.js`
```javascript
app.post('/api/reclutas', async (req, res) => {
    // req.body: { nombre, contacto, fecha, frente }
    // Inserta en Usuarios + RegistrosAlistamiento y responde:
    // { datos: { NombreClave, CodigoAlistamiento } }
});
```

### 3.2 Conectar formulario en `Js babel/Enlistamiento.js`
```javascript
const response = await fetch('http://localhost:3000/api/reclutas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        nombre: recruitNameValue,
        contacto: contactValue,
        fecha: dateValue,
        frente: selectedFront
    })
});
```

### 3.3 Probar endpoint
Inicia el servidor y prueba el POST:
```bash
pnpm run dev
```

```bash
curl -X POST http://localhost:3000/api/reclutas ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Agente Demo\",\"contacto\":\"demo@gmail.com\",\"fecha\":\"27/05/2026\",\"frente\":\"Frente Este (Русский)\"}"
```

Respuesta esperada:
```json
{
  "mensaje": "Recluta registrado.",
  "datos": {
    "NombreClave": "AGENTEDEMO-123",
    "CodigoAlistamiento": "AL-148-001"
  }
}
```

---

## Paso 4: Verificar Backend (GET /api/mazos)

### 4.1 Verificar endpoints en `index.js`

Asegúrate de que tu `index.js` tenga:

```javascript
// --- NUEVA RUTA GET: Obtener Armería de Mazos ---
app.get('/api/mazos', async (req, res) => {
    try {
        const pool = await getConnection();
        
        const result = await pool.request().query(`
            SELECT 
                m.IdMazo AS id,
                m.NombreMazo AS nombre,
                m.Descripcion AS descripcion,
                i.CodigoISO AS idioma,
                i.Nombre AS idiomaNombre,
                c.NombreCategoria AS categoria,
                n.IdNivel AS nivel,
                n.NombreNivel AS nivelNombre,
                CASE m.IdCategoria
                    WHEN 1 THEN 'bi bi-crosshair2'
                    WHEN 2 THEN 'bi bi-shield'
                    WHEN 3 THEN 'bi bi-chat'
                    WHEN 4 THEN 'bi bi-book'
                    WHEN 5 THEN 'bi bi-eye'
                    ELSE 'bi bi-journal'
                END AS icono,
                (SELECT COUNT(*) FROM Flashcards f WHERE f.IdMazo = m.IdMazo) AS totalFlashcards,
                0 AS completadas
            FROM MazosFlashcards m
            LEFT JOIN Idiomas i ON m.IdIdioma = i.IdIdioma
            LEFT JOIN Categorias c ON m.IdCategoria = c.IdCategoria
            LEFT JOIN NivelesDificultad n ON m.IdNivel = n.IdNivel
            WHERE m.Activo = 1
            ORDER BY m.OrdenVisual ASC, m.IdMazo ASC;
        `);

        res.status(200).json(result.recordset);

    } catch (error) {
        console.error('Error al acceder a la armería de mazos:', error);
        console.error('Detalles:', error.message, error.number, error.code);
        res.status(500).json({ 
            error: 'Fallo al cargar los mazos desde la base de datos.',
            detalles: error.message
        });
    }
});
```

### 4.2 Iniciar servidor
```bash
pnpm run dev
```

### 4.3 Probar endpoint
Abre en navegador:
```
http://localhost:3000/api/mazos
```

**Debería devolver JSON con los 4 mazos**

---

## Paso 5: Arreglar CSS

### 5.1 Editar `Mazos.css`

**Cambio 1:** Modificar `.main-content`
```css
.main-content {
    flex: 1;
    position: relative;
    z-index: 5;
    padding-top: calc(var(--nav-height) + 30px);
    padding-bottom: 40px;
    /* QUITAR: min-height: 0; */
}
```

**Cambio 2:** Modificar `footer`
```css
footer {
    position: relative;
    overflow: hidden;
    background: linear-gradient(to top, #000 0%, #020202 55%, #070707 100%);
    padding: 70px 50px 55px;
    font-size: 0.8rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    color: #a0a0a0;
    text-align: center;
    z-index: 10;
    margin-top: auto;
    flex-shrink: 0;  /* AGREGAR ESTA LÍNEA */
}
```

---

## Paso 6: Arreglar Lógica de Filtros

### 6.1 Editar `Mazos.js`

**Cambio en `filtrarMazos()`:**

```javascript
function filtrarMazos() {
    return state.mazos.filter(mazo => {
        // IMPORTANTE: Usar toLowerCase() para comparación case-insensitive
        const matchIdioma = !state.filtroIdioma || mazo.idioma.toLowerCase() === state.filtroIdioma.toLowerCase();
        const matchNivel = !state.filtroNivel || mazo.nivel === parseInt(state.filtroNivel);
        return matchIdioma && matchNivel;
    });
}
```

**Por qué:** 
- API devuelve `idioma: "RU"` (mayúsculas)
- Select envía `value="ru"` (minúsculas)
- Sin `.toLowerCase()`, `"RU" !== "ru"` → Filtro no funciona

---

## Comandos Útiles

### Verificar conexión a BD
```bash
pnpm node debug-mazos.js
```

### Insertar datos de prueba
```bash
pnpm node seed-data.js
```

### Iniciar servidor backend
```bash
pnpm run dev
```

### Limpiar caché del navegador
Presiona: **Ctrl + Shift + R**

### Ver logs del servidor
El servidor muestra en consola:
```
División de Ingeniería ejecutándose en el puerto 3000
```

---

## Checklist de Verificación

- [ ] `.env` configurado correctamente
- [ ] SQL Server conectado y corriendo
- [ ] `debug-mazos.js` muestra conexión exitosa
- [ ] `seed-data.js` insertó datos (4 mazos, 13 flashcards)
- [ ] Servidor backend corriendo en puerto 3000
- [ ] `POST /api/reclutas` responde 201 y retorna `NombreClave` + `CodigoAlistamiento`
- [ ] `http://localhost:3000/api/mazos` devuelve JSON
- [ ] Página `Mazos.html` carga los mazos
- [ ] Filtros funcionan (Ruso, Mandarín, Niveles)
- [ ] Footer no se superpone con contenido
- [ ] GET `/api/mazos` retorna `idioma` en minúsculas

---

## Troubleshooting

### ❌ "Cannot find module 'db'"
```bash
pnpm install
```

### ❌ Conexión rechazada a BD
- Verifica credenciales en `.env`
- Verifica que SQL Server esté corriendo
- Verifica puerto 1433 esté disponible

### ❌ Mazos no aparecen en la página
1. Abre F12 (Dev Tools)
2. Mira la sección "Console" para errores
3. Mira "Network" → filtro por "mazos" → respuesta del servidor

### ❌ Filtros no funcionan
- Revisa que `.toLowerCase()` esté en `filtrarMazos()`
- Abre Dev Tools → Console → ejecuta: `console.log(state.mazos[0])`
- Verifica el valor de `idioma` (debe ser mayúsculas)

---

## Contacto y Documentación

**Desarrollado por:**
- Akir (Maria Fernanda P.)
- Mauo (David Mauricio P.)

**Última actualización:** 25/05/2026
