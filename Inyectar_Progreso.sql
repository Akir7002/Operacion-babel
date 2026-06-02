-- ==============================================================================
-- PROTOCOLO DE ASCENSO ACELERADO (INYECCIÓN DE PROGRESO)
-- Ejecuta este script en tu SQL Server Management Studio para darle
-- estadísticas de General a tu usuario.
-- ==============================================================================

USE Tu_Nombre_De_BD; -- Asegúrate de que este es el nombre de tu base de datos
GO

DECLARE @CorreoObjetivo NVARCHAR(255) = 'tu_correo@gmail.com'; -- CAMBIA ESTO POR EL CORREO QUE USASTE AL REGISTRARTE
DECLARE @IdUsuario INT;

-- 1. Obtener el IdUsuario a partir del correo en RegistrosAlistamiento
SELECT @IdUsuario = IdUsuario 
FROM RegistrosAlistamiento 
WHERE FrecuenciaContacto = @CorreoObjetivo;

IF @IdUsuario IS NOT NULL
BEGIN
    PRINT 'Iniciando protocolo de ascenso para IdUsuario: ' + CAST(@IdUsuario AS VARCHAR(10));

    -- 2. Modificar el Usuario (Subirlo a General, darle 5000 puntos y vidas completas)
    UPDATE Usuarios
    SET 
        IdRango = 3, -- 3 = General
        VidasActuales = 5,
        PuntosTotales = 5450,
        NombreClave = 'GENERAL_ELITE'
    WHERE IdUsuario = @IdUsuario;

    PRINT 'Rango y Puntos actualizados con éxito. ¡Bienvenida a la élite, General!';
END
ELSE
BEGIN
    PRINT 'ERROR: No se encontró ningún soldado con el correo: ' + @CorreoObjetivo;
    PRINT 'Por favor, asegúrate de haber creado el usuario primero y pon el correo correcto arriba.';
END
GO
