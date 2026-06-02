-- ==============================================================================
-- VISTAS DE LA BASE DE DATOS: OPERACION BABEL
-- Ejecuta este script en tu SQL Server Management Studio para crear las vistas
-- requeridas para los reportes (ej. exportación a Excel)
-- ==============================================================================

USE OperacionBabel;
GO

-- 1. VISTA DE ESTADÍSTICAS GLOBALES DE RECLUTAS
-- Combina la información del usuario con su registro de alistamiento y rango.
CREATE OR ALTER VIEW Vista_EstadisticasReclutas AS
SELECT 
    U.IdUsuario,
    U.NombreClave,
    CASE 
        WHEN U.IdRango = 1 THEN 'Recluta'
        WHEN U.IdRango = 2 THEN 'Operador'
        WHEN U.IdRango = 3 THEN 'General'
        ELSE 'Desconocido'
    END AS RangoMilitar,
    U.PuntosTotales,
    U.VidasActuales,
    ISNULL(R.FrenteAsignado, 'No Asignado') AS FrenteAsignado,
    ISNULL(CONVERT(VARCHAR, R.FechaAlistamiento, 120), 'Sin Registro') AS FechaAlistamiento,
    U.EstadoCuenta
FROM 
    Usuarios U
LEFT JOIN 
    RegistrosAlistamiento R ON U.IdUsuario = R.IdUsuario;
GO

-- 2. VISTA DEL SALÓN DE LA FAMA (TOP AGENTES)
-- Muestra a los mejores agentes ordenados por sus puntos totales.
CREATE OR ALTER VIEW Vista_TopAgentes AS
SELECT TOP 100
    U.NombreClave,
    U.PuntosTotales,
    CASE 
        WHEN U.IdRango = 1 THEN 'Recluta'
        WHEN U.IdRango = 2 THEN 'Operador'
        WHEN U.IdRango = 3 THEN 'General'
        ELSE 'Desconocido'
    END AS RangoMilitar,
    R.FrenteAsignado
FROM 
    Usuarios U
LEFT JOIN 
    RegistrosAlistamiento R ON U.IdUsuario = R.IdUsuario
WHERE 
    U.EstadoCuenta = 'ACTIVO'
ORDER BY 
    U.PuntosTotales DESC;
GO

PRINT 'Vistas creadas correctamente. Listas para ser consultadas por Babel DB.';
