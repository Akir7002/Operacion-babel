# 🔧 Guía de Configuración: Conexión Node.js a SQL Server Express

## ✅ Lo que se hizo para hacer funcionar el sistema Operación Babel

---

## 1️⃣ Instalación de SQL Server Express

### Requisitos:
- **SQL Server Express 2022** instalado
- **SQL Server Management Studio 22+** instalado
- **SQL Server Browser Service** ejecutándose

### Verificar que los servicios estén corriendo:
```powershell
Get-Service | Where-Object {$_.Name -like '*SQL*'} | Select-Object Status, DisplayName, Name
```

Debe aparecer:
- ✅ `MSSQL$SQLEXPRESS` - **Running**
- ✅ `SQLBrowser` - **Running**

---

## 2️⃣ Habilitar protocolo TCP/IP

### Pasos en SQL Server Configuration Manager:

1. **Abre** `SQLServerManager19.msc` (o `SQLServerManager20.msc` para SQL Server 2022)
2. **Navega a**: SQL Server Network Configuration → Protocols for SQLEXPRESS
3. **Verifica que TCP/IP esté ENABLED** (debe estar en verde)
   - Si está **Disabled**, haz clic derecho → **Enable**
4. **Abre Properties de TCP/IP**:
   - Ve a pestaña **IP Addresses**
   - Busca la sección **IPAll** (al final)
   - En el campo **TCP Port**, escribe: `1433`
   - Click en **OK**

### Reinicia el servicio:
```powershell
Restart-Service 'MSSQL$SQLEXPRESS'
```

### Verifica que el puerto esté escuchando:
```powershell
netstat -ano | findstr :1433
```

Debe aparecer una línea con `LISTENING`.

---

## 3️⃣ Configuración del código Node.js

### Archivo: `.env`
```
DB_USER=sa
DB_PASSWORD=OperacionBabel2026!
DB_SERVER=localhost
DB_DATABASE=OperacionBabel
DB_PORT=1433
PORT=3000
```

### Archivo: `db.js`
```javascript
const sql = require('mssql');
require('dotenv').config();

const dbSettings = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, 
        trustServerCertificate: true,
    },
};

const getConnection = async () => {
    try {
        const pool = await sql.connect(dbSettings);
        console.log('Conexión táctica a OperacionBabel establecida.');
        return pool;
    } catch (error) {
        console.error('Fallo crítico en la conexión a la base de datos:', error);
        throw error;
    }
};

module.exports = { sql, getConnection };
```

**Nota**: El orden de propiedades en `dbSettings` es importante. `server` va primero, luego `port` como número entero.

### Archivo: `index.js` (importar sql)
```javascript
const express = require('express');
const cors = require('cors');
const { getConnection, sql } = require('./db');  // ← AGREGUE sql
require('dotenv').config();
```

---

## 4️⃣ Crear la Base de Datos

### En SQL Server Management Studio:

1. **Abre** SQL Server Management Studio
2. **Conecta** al servidor local (localhost)
3. **Nueva Query** (Ctrl + N)
4. **Copia y pega** todo el contenido de: `database/Babelsqlbase.txt`
5. **Ejecuta** (F5 o botón Execute)
6. **Espera** a que termine sin errores

---

## 5️⃣ Corregir código JavaScript duplicado

### Archivo: `Js babel/Enlistamiento.js`

**Problema**: Había una función `processForm()` duplicada (líneas 130-167 y 169-233).

**Solución**: Mantener solo la versión **async** y remover la primera versión síncrona.

La función async debe verse así:
```javascript
async function processForm(event) {
    if (event) {
        event.preventDefault();
    }

    const recruitNameValue = recruitNameInput ? recruitNameInput.value.trim() : '';
    const contactValue = contactFrequencyInput ? contactFrequencyInput.value.trim() : '';
    const dateValue = enlistmentDateInput ? enlistmentDateInput.value.trim() : '';
    const selectedFront = frontAssignedSelect ? frontAssignedSelect.value : '';

    // ... validaciones ...

    try {
        showStamp(); 
        stamp.textContent = "TRANSMITIENDO...";

        const response = await fetch('http://localhost:3000/api/reclutas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: recruitNameValue,
                contacto: contactValue,
                fecha: dateValue,
                frente: selectedFront
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Fallo en la transmisión de datos.');
        }

        stamp.textContent = "APROBADO";
        window.setTimeout(() => {
            hideStamp();
            showSummary(recruitNameValue, contactValue, dateValue, selectedFront);
            console.log(`Recluta registrado. Nombre Clave: ${data.datos.NombreClave}, Código: ${data.datos.CodigoAlistamiento}`);
        }, 2000);

    } catch (error) {
        console.error('Error de comunicación:', error);
        hideStamp();
        triggerGameOver();
    }
}
```

---

## 🚀 Flujo de Inicio Rápido

Cada vez que reinicies tu PC o quieras ejecutar el proyecto:

### 1. Verifica que SQL Server esté corriendo:
```powershell
Get-Service 'MSSQL$SQLEXPRESS' | Select-Object Status
```

Si sale `Stopped`, reinicia:
```powershell
Start-Service 'MSSQL$SQLEXPRESS'
Start-Service SQLBrowser
```

### 2. Inicia Node.js:
```bash
cd C:\Users\maria\OneDrive\Documents\Trabajitos\Humano computador\Operaciones babel
pnpm run dev
```

### 3. Abre la aplicación:
- Browser: `http://localhost:3000`
- Navega a: **Registro de Reclutas** (Formulario de Procesamiento de Reclutas)

### 4. Prueba el formulario:
- Nombre completo: cualquier nombre
- Email: cualquier email @gmail.com
- Fecha: dd/mm/aaaa
- Frente: selecciona uno
- Presiona: "Confirmar Transmisión"
- Debe mostrar: **"APROBADO"** ✅

---

## 🔍 Troubleshooting

### Error: "Port for SQLEXPRESS not found"
→ TCP/IP no está habilitado. Ver paso 2️⃣.

### Error: "Failed to connect to localhost:1433"
→ El puerto 1433 no está escuchando. Ver paso 2️⃣ y verifica con `netstat`.

### Error: "ReferenceError: require is not defined"
→ Asegúrate de que `package.json` NO tenga `"type": "module"`. Debe usar CommonJS.

### Error: "sql is not defined"
→ Verifica que `index.js` importe `sql` desde `db.js`. Ver paso 3️⃣.

---

## 📝 Resumen de cambios clave

| Archivo | Cambio |
|---------|--------|
| `.env` | Server: `localhost`, Port: `1433` (sin instancia) |
| `db.js` | Reordenar props: server, port, user, password, database |
| `index.js` | Agregar `sql` a la importación de `./db` |
| `Js babel/Enlistamiento.js` | Remover función `processForm()` duplicada |
| SQL Server Config | Habilitar TCP/IP, puerto 1433 |

---

**✅ Sistema operativo:**  Windows 10/11
**✅ SQL Server:** Express 2022
**✅ Node.js:** v22+
**✅ Package Manager:** pnpm
