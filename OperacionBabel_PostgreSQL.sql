-- ═══════════════════════════════════════════════════════════════════════════════
-- OPERACIÓN BABEL - Script de Migración a PostgreSQL
-- Convertido desde Microsoft SQL Server (T-SQL) → PostgreSQL
-- Fecha de conversión: 2026-07-23
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. CREAR BASE DE DATOS (ejecutar como superusuario)
-- CREATE DATABASE operacionbabel
--     WITH ENCODING = 'UTF8'
--     LC_COLLATE = 'es_ES.UTF-8'
--     LC_CTYPE = 'es_ES.UTF-8';

-- Conectarse a la base de datos:
-- \c operacionbabel;

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXTENSIONES NECESARIAS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. LIMPIEZA OPCIONAL DEL ESQUEMA
-- ═══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS Estadisticas CASCADE;
DROP TABLE IF EXISTS RachaDiaria CASCADE;
DROP TABLE IF EXISTS UsuarioLogros CASCADE;
DROP TABLE IF EXISTS ProgresoFlashcards CASCADE;
DROP TABLE IF EXISTS HistorialGameOver CASCADE;
DROP TABLE IF EXISTS HistorialErrores CASCADE;
DROP TABLE IF EXISTS DesafiosInfiltracion CASCADE;
DROP TABLE IF EXISTS SesionesEntrenamiento CASCADE;
DROP TABLE IF EXISTS Logros CASCADE;
DROP TABLE IF EXISTS ConfiguracionUsuario CASCADE;
DROP TABLE IF EXISTS RegistrosAlistamiento CASCADE;
DROP TABLE IF EXISTS Usuarios CASCADE;
DROP TABLE IF EXISTS Flashcards CASCADE;
DROP TABLE IF EXISTS MazosFlashcards CASCADE;
DROP TABLE IF EXISTS Frases CASCADE;
DROP TABLE IF EXISTS Diccionario CASCADE;
DROP TABLE IF EXISTS NivelesDificultad CASCADE;
DROP TABLE IF EXISTS Categorias CASCADE;
DROP TABLE IF EXISTS Rangos CASCADE;
DROP TABLE IF EXISTS Idiomas CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAPA 1: CATÁLOGOS MAESTROS (4 tablas)
-- ═══════════════════════════════════════════════════════════════════════════════

-- [01] IDIOMAS
CREATE TABLE Idiomas (
    IdIdioma        SERIAL PRIMARY KEY,
    Nombre          VARCHAR(50)     NOT NULL,
    CodigoISO       CHAR(2)         NOT NULL,
    EsteticaVisual  VARCHAR(50)     NULL,

    CONSTRAINT UQ_Idiomas_CodigoISO UNIQUE (CodigoISO),
    CONSTRAINT UQ_Idiomas_Nombre UNIQUE (Nombre)
);

CREATE INDEX IX_Idiomas_Nombre ON Idiomas(Nombre);

-- [02] RANGOS
CREATE TABLE Rangos (
    IdRango         SERIAL PRIMARY KEY,
    NombreRango     VARCHAR(50)     NOT NULL,
    NivelRequerido  INT             NOT NULL,
    IconoMilitar    VARCHAR(50)     NULL,
    Descripcion     VARCHAR(255)    NULL,

    CONSTRAINT UQ_Rangos_NombreRango UNIQUE (NombreRango)
);

CREATE INDEX IX_Rangos_NivelRequerido ON Rangos(NivelRequerido);

-- [03] CATEGORIAS
CREATE TABLE Categorias (
    IdCategoria     SERIAL PRIMARY KEY,
    NombreCategoria VARCHAR(100)    NOT NULL,
    Descripcion     VARCHAR(255)    NULL,
    IconoMilitar    VARCHAR(50)     NULL,
    OrdenVisual     INT             DEFAULT 0,

    CONSTRAINT UQ_Categorias_Nombre UNIQUE (NombreCategoria)
);

CREATE INDEX IX_Categorias_Orden ON Categorias(OrdenVisual);

-- [04] NIVELES DE DIFICULTAD
CREATE TABLE NivelesDificultad (
    IdNivel             SERIAL PRIMARY KEY,
    NombreNivel         VARCHAR(50)     NOT NULL,
    Descripcion         VARCHAR(255)    NULL,
    MultiplicadorPuntos DECIMAL(3,2)    DEFAULT 1.00,
    ColorTema           VARCHAR(20)     NULL,

    CONSTRAINT UQ_Niveles_Nombre UNIQUE (NombreNivel),
    CONSTRAINT CK_Niveles_Multiplicador CHECK (MultiplicadorPuntos > 0)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAPA 2: NÚCLEO DE CONTENIDO (4 tablas)
-- ═══════════════════════════════════════════════════════════════════════════════

-- [05] DICCIONARIO
CREATE TABLE Diccionario (
    IdItem              SERIAL PRIMARY KEY,
    IdIdioma            INT             NOT NULL,
    IdCategoria         INT             NULL,
    IdNivel             INT             NULL,
    CaracterOriginal    VARCHAR(255)    NOT NULL,
    LecturaAyuda        VARCHAR(255)    NULL,
    TraduccionEspanol   VARCHAR(255)    NOT NULL,
    AudioUrl            VARCHAR(500)    NULL,
    NotasContexto       VARCHAR(500)    NULL,
    FechaCreacion       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    Activo              BOOLEAN         DEFAULT TRUE,

    CONSTRAINT FK_Diccionario_Idioma FOREIGN KEY (IdIdioma)
        REFERENCES Idiomas(IdIdioma) ON DELETE CASCADE,
    CONSTRAINT FK_Diccionario_Categoria FOREIGN KEY (IdCategoria)
        REFERENCES Categorias(IdCategoria) ON DELETE SET NULL,
    CONSTRAINT FK_Diccionario_Nivel FOREIGN KEY (IdNivel)
        REFERENCES NivelesDificultad(IdNivel) ON DELETE SET NULL
);

CREATE INDEX IX_Diccionario_IdIdioma_IdCategoria ON Diccionario(IdIdioma, IdCategoria);
CREATE INDEX IX_Diccionario_IdNivel ON Diccionario(IdNivel);
CREATE INDEX IX_Diccionario_Activo_IdIdioma ON Diccionario(Activo, IdIdioma);
CREATE INDEX IX_Diccionario_CaracterOriginal ON Diccionario(CaracterOriginal);

-- [06] FRASES
CREATE TABLE Frases (
    IdFrase             SERIAL PRIMARY KEY,
    IdIdioma            INT             NOT NULL,
    IdNivel             INT             NULL,
    FraseOriginal       VARCHAR(500)    NOT NULL,
    TraduccionEspanol   VARCHAR(500)    NOT NULL,
    Pista               VARCHAR(255)    NULL,
    LetrasOcultas       INT             NULL,
    TiempoLimiteSeg     INT             DEFAULT 60,

    CONSTRAINT FK_Frases_Idioma FOREIGN KEY (IdIdioma)
        REFERENCES Idiomas(IdIdioma) ON DELETE CASCADE,
    CONSTRAINT FK_Frases_Nivel FOREIGN KEY (IdNivel)
        REFERENCES NivelesDificultad(IdNivel) ON DELETE SET NULL
);

CREATE INDEX IX_Frases_IdIdioma_IdNivel ON Frases(IdIdioma, IdNivel);
CREATE INDEX IX_Frases_LetrasOcultas ON Frases(LetrasOcultas);

-- [07] MAZOS DE FLASHCARDS
CREATE TABLE MazosFlashcards (
    IdMazo          SERIAL PRIMARY KEY,
    IdIdioma        INT             NOT NULL,
    IdCategoria     INT             NULL,
    IdNivel         INT             NULL,
    NombreMazo      VARCHAR(100)    NOT NULL,
    Descripcion     VARCHAR(255)    NULL,
    ImagenPortada   VARCHAR(500)    NULL,
    OrdenVisual     INT             DEFAULT 0,
    Activo          BOOLEAN         DEFAULT TRUE,

    CONSTRAINT FK_Mazos_Idioma FOREIGN KEY (IdIdioma)
        REFERENCES Idiomas(IdIdioma) ON DELETE CASCADE,
    CONSTRAINT FK_Mazos_Categoria FOREIGN KEY (IdCategoria)
        REFERENCES Categorias(IdCategoria) ON DELETE SET NULL,
    CONSTRAINT FK_Mazos_Nivel FOREIGN KEY (IdNivel)
        REFERENCES NivelesDificultad(IdNivel) ON DELETE SET NULL
);

CREATE INDEX IX_Mazos_IdIdioma_IdNivel ON MazosFlashcards(IdIdioma, IdNivel);
CREATE INDEX IX_Mazos_Activo ON MazosFlashcards(Activo);

-- [08] FLASHCARDS
CREATE TABLE Flashcards (
    IdFlashcard     SERIAL PRIMARY KEY,
    IdMazo          INT             NOT NULL,
    IdItem          INT             NOT NULL,
    OrdenEnMazo     INT             DEFAULT 0,
    CaraFrontal     VARCHAR(500)    NULL,
    CaraTrasera     VARCHAR(500)    NULL,
    TipoFlashcard   VARCHAR(20)     DEFAULT 'NORMAL',

    CONSTRAINT FK_Flashcards_Mazo FOREIGN KEY (IdMazo)
        REFERENCES MazosFlashcards(IdMazo) ON DELETE CASCADE,
    CONSTRAINT FK_Flashcards_Item FOREIGN KEY (IdItem)
        REFERENCES Diccionario(IdItem) ON DELETE NO ACTION
);

CREATE INDEX IX_Flashcards_IdMazo_Orden ON Flashcards(IdMazo, OrdenEnMazo);
CREATE INDEX IX_Flashcards_IdItem ON Flashcards(IdItem);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAPA 3: USUARIOS Y CONFIGURACIÓN (4 tablas)
-- ═══════════════════════════════════════════════════════════════════════════════

-- [09] USUARIOS (Soldados)
CREATE TABLE Usuarios (
    IdUsuario           SERIAL PRIMARY KEY,
    IdRango             INT             DEFAULT 1,
    IdIdiomaPreferido   INT             NULL,
    NombreClave         VARCHAR(100)    NOT NULL,
    HashContrasena      VARCHAR(255)    NOT NULL,
    VidasActuales       INT             DEFAULT 5,
    RachaDias           INT             DEFAULT 0,
    PuntosTotales       INT             DEFAULT 0,
    UltimaConexion      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FechaRegistro       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    EstadoCuenta        VARCHAR(20)     DEFAULT 'ACTIVA',

    CONSTRAINT FK_Usuarios_Rango FOREIGN KEY (IdRango)
        REFERENCES Rangos(IdRango) ON DELETE SET DEFAULT,
    CONSTRAINT FK_Usuarios_Idioma FOREIGN KEY (IdIdiomaPreferido)
        REFERENCES Idiomas(IdIdioma) ON DELETE SET NULL,

    CONSTRAINT UQ_Usuarios_NombreClave UNIQUE (NombreClave),
    CONSTRAINT CK_Usuarios_Vidas CHECK (VidasActuales >= 0 AND VidasActuales <= 5),
    CONSTRAINT CK_Usuarios_Racha CHECK (RachaDias >= 0)
);

CREATE INDEX IX_Usuarios_NombreClave ON Usuarios(NombreClave);
CREATE INDEX IX_Usuarios_IdRango ON Usuarios(IdRango);
CREATE INDEX IX_Usuarios_IdIdiomaPreferido ON Usuarios(IdIdiomaPreferido);
CREATE INDEX IX_Usuarios_UltimaConexion ON Usuarios(UltimaConexion);

-- [10] CONFIGURACIÓN DE USUARIO
CREATE TABLE ConfiguracionUsuario (
    IdConfiguracion         SERIAL PRIMARY KEY,
    IdUsuario               INT             NOT NULL UNIQUE,
    SonidoActivado          BOOLEAN         DEFAULT TRUE,
    EfectosVisuales         BOOLEAN         DEFAULT TRUE,
    TemaVisual              VARCHAR(50)     DEFAULT 'terminal_verde',
    VolumenGeneral          INT             DEFAULT 80,
    NotificacionesActivadas BOOLEAN         DEFAULT TRUE,
    AnimacionesReducidas    BOOLEAN         DEFAULT FALSE,
    ModoDaltonico           BOOLEAN         DEFAULT FALSE,

    CONSTRAINT FK_Config_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,

    CONSTRAINT CK_Config_Volumen CHECK (VolumenGeneral >= 0 AND VolumenGeneral <= 100)
);

CREATE INDEX IX_Config_TemaVisual ON ConfiguracionUsuario(TemaVisual);

-- [11] REGISTROS DE ALISTAMIENTO
CREATE TABLE RegistrosAlistamiento (
    IdRegistro          SERIAL PRIMARY KEY,
    IdUsuario           INT             NOT NULL,
    NombreCompleto      VARCHAR(200)    NULL,
    FrecuenciaContacto  VARCHAR(100)    NULL,
    FechaAlistamiento   DATE            DEFAULT CURRENT_DATE,
    FrenteAsignado      VARCHAR(100)    NULL,
    EstadoAprobacion    BOOLEAN         DEFAULT TRUE,
    CodigoAlistamiento  VARCHAR(20)    NULL UNIQUE,

    CONSTRAINT FK_Registro_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE
);

CREATE INDEX IX_Registros_IdUsuario ON RegistrosAlistamiento(IdUsuario);
CREATE INDEX IX_Registros_FechaAlistamiento ON RegistrosAlistamiento(FechaAlistamiento);

-- [12] LOGROS / INSIGNIAS MILITARES
CREATE TABLE Logros (
    IdLogro             SERIAL PRIMARY KEY,
    NombreLogro         VARCHAR(100)    NOT NULL,
    Descripcion         VARCHAR(255)    NULL,
    Icono               VARCHAR(50)     NULL,
    CondicionDesbloqueo VARCHAR(255)    NULL,
    CodigoCondicion     VARCHAR(50)     NULL,
    PuntosRecompensa    INT             DEFAULT 0,
    Secreto             BOOLEAN         DEFAULT FALSE,

    CONSTRAINT UQ_Logros_Nombre UNIQUE (NombreLogro)
);

CREATE INDEX IX_Logros_CodigoCondicion ON Logros(CodigoCondicion);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAPA 4: TRANSACCIONES Y SEGUIMIENTO (4 tablas)
-- ═══════════════════════════════════════════════════════════════════════════════

-- [13] SESIONES DE ENTRENAMIENTO
CREATE TABLE SesionesEntrenamiento (
    IdSesion        SERIAL PRIMARY KEY,
    IdUsuario       INT             NOT NULL,
    FechaInicio     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    FechaFin        TIMESTAMP       NULL,
    VidasInicio     INT             DEFAULT 5,
    VidasFinal      INT             NULL,
    PuntajeTotal    INT             DEFAULT 0,
    EstadoSesion    VARCHAR(20)     DEFAULT 'ACTIVA',
    ModoJuego       VARCHAR(20)     DEFAULT 'FLASHCARDS',
    TiempoTotalSeg  INT             DEFAULT 0,

    CONSTRAINT FK_Sesiones_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,

    CONSTRAINT CK_Sesiones_VidasInicio CHECK (VidasInicio >= 0 AND VidasInicio <= 5),
    CONSTRAINT CK_Sesiones_Estado CHECK (EstadoSesion IN ('ACTIVA', 'COMPLETADA', 'GAME_OVER', 'ABANDONADA'))
);

CREATE INDEX IX_Sesiones_IdUsuario_FechaInicio ON SesionesEntrenamiento(IdUsuario, FechaInicio);
CREATE INDEX IX_Sesiones_Estado ON SesionesEntrenamiento(EstadoSesion);
CREATE INDEX IX_Sesiones_FechaInicio ON SesionesEntrenamiento(FechaInicio);

-- [14] DESAFÍOS DE INFILTRACIÓN
CREATE TABLE DesafiosInfiltracion (
    IdDesafio           SERIAL PRIMARY KEY,
    IdSesion            INT             NOT NULL,
    IdFrase             INT             NOT NULL,
    IntentosRealizados  INT             DEFAULT 0,
    IntentosMaximos     INT             DEFAULT 3,
    Completado          BOOLEAN         DEFAULT FALSE,
    FechaDesafio        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    TiempoResolucionSeg INT             NULL,
    PuntosObtenidos     INT             DEFAULT 0,

    CONSTRAINT FK_Desafios_Sesion FOREIGN KEY (IdSesion)
        REFERENCES SesionesEntrenamiento(IdSesion) ON DELETE CASCADE,
    CONSTRAINT FK_Desafios_Frase FOREIGN KEY (IdFrase)
        REFERENCES Frases(IdFrase) ON DELETE CASCADE
);

CREATE INDEX IX_Desafios_IdSesion_Completado ON DesafiosInfiltracion(IdSesion, Completado);
CREATE INDEX IX_Desafios_IdFrase ON DesafiosInfiltracion(IdFrase);

-- [15] HISTORIAL DE ERRORES
CREATE TABLE HistorialErrores (
    IdError             SERIAL PRIMARY KEY,
    IdUsuario           INT             NOT NULL,
    IdItem              INT             NOT NULL,
    FechaFallo          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    IntentosFallidos    INT             DEFAULT 1,
    TipoError           VARCHAR(50)     NULL,
    Contexto            VARCHAR(255)    NULL,
    Revisado            BOOLEAN         DEFAULT FALSE,

    CONSTRAINT FK_Errores_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_Errores_Item FOREIGN KEY (IdItem)
        REFERENCES Diccionario(IdItem) ON DELETE CASCADE
);

CREATE INDEX IX_Errores_IdUsuario_FechaFallo ON HistorialErrores(IdUsuario, FechaFallo);
CREATE INDEX IX_Errores_IdItem_FechaFallo ON HistorialErrores(IdItem, FechaFallo);
CREATE INDEX IX_Errores_IdUsuario_IdItem ON HistorialErrores(IdUsuario, IdItem);
CREATE INDEX IX_Errores_Revisado ON HistorialErrores(Revisado, FechaFallo);

-- [16] HISTORIAL GAME OVER
CREATE TABLE HistorialGameOver (
    IdGameOver      SERIAL PRIMARY KEY,
    IdUsuario       INT             NOT NULL,
    IdSesion        INT             NULL,
    FechaGameOver   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CausaMuerte     VARCHAR(100)    NULL,
    ProgresoPerdido INT             DEFAULT 0,
    MensajeFinal    VARCHAR(255)    NULL,

    CONSTRAINT FK_GO_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_GO_Sesion FOREIGN KEY (IdSesion)
        REFERENCES SesionesEntrenamiento(IdSesion) ON DELETE NO ACTION
);

CREATE INDEX IX_GO_IdUsuario_Fecha ON HistorialGameOver(IdUsuario, FechaGameOver);
CREATE INDEX IX_GO_IdSesion ON HistorialGameOver(IdSesion);
CREATE INDEX IX_GO_CausaMuerte ON HistorialGameOver(CausaMuerte);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CAPA 5: PROGRESO Y ESTADÍSTICAS (4 tablas)
-- ═══════════════════════════════════════════════════════════════════════════════

-- [17] PROGRESO POR FLASHCARD
CREATE TABLE ProgresoFlashcards (
    IdProgreso          SERIAL PRIMARY KEY,
    IdUsuario           INT             NOT NULL,
    IdFlashcard         INT             NOT NULL,
    VecesVista          INT             DEFAULT 0,
    VecesAcertada       INT             DEFAULT 0,
    VecesFallada        INT             DEFAULT 0,
    UltimaRevision      TIMESTAMP       NULL,
    Dominada            BOOLEAN         DEFAULT FALSE,
    NivelConfianza      INT             DEFAULT 0,
    ProximaRevision     TIMESTAMP       NULL,

    CONSTRAINT FK_Progreso_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_Progreso_Flashcard FOREIGN KEY (IdFlashcard)
        REFERENCES Flashcards(IdFlashcard) ON DELETE CASCADE,

    CONSTRAINT UQ_Progreso_Usuario_Flashcard UNIQUE (IdUsuario, IdFlashcard)
);

CREATE INDEX IX_Progreso_IdUsuario_Dominada ON ProgresoFlashcards(IdUsuario, Dominada);
CREATE INDEX IX_Progreso_ProximaRevision ON ProgresoFlashcards(ProximaRevision);
CREATE INDEX IX_Progreso_IdFlashcard ON ProgresoFlashcards(IdFlashcard);

-- [18] LOGROS POR USUARIO
CREATE TABLE UsuarioLogros (
    IdUsuarioLogro  SERIAL PRIMARY KEY,
    IdUsuario       INT             NOT NULL,
    IdLogro         INT             NOT NULL,
    FechaDesbloqueo TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    Notificado      BOOLEAN         DEFAULT FALSE,

    CONSTRAINT FK_UL_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,
    CONSTRAINT FK_UL_Logro FOREIGN KEY (IdLogro)
        REFERENCES Logros(IdLogro) ON DELETE CASCADE,

    CONSTRAINT UQ_UsuarioLogros_Usuario_Logro UNIQUE (IdUsuario, IdLogro)
);

CREATE INDEX IX_UL_IdUsuario ON UsuarioLogros(IdUsuario);
CREATE INDEX IX_UL_IdLogro ON UsuarioLogros(IdLogro);
CREATE INDEX IX_UL_FechaDesbloqueo ON UsuarioLogros(FechaDesbloqueo);

-- [19] RACHA DIARIA DETALLADA
CREATE TABLE RachaDiaria (
    IdRacha                 SERIAL PRIMARY KEY,
    IdUsuario               INT             NOT NULL,
    Fecha                   DATE            NOT NULL,
    EntrenamientoCompletado BOOLEAN         DEFAULT FALSE,
    PuntosDelDia            INT             DEFAULT 0,
    MinutosEntrenados       INT             DEFAULT 0,
    FlashcardsRevisadas     INT             DEFAULT 0,
    DesafiosCompletados     INT             DEFAULT 0,

    CONSTRAINT FK_Racha_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,

    CONSTRAINT UQ_Racha_Usuario_Fecha UNIQUE (IdUsuario, Fecha)
);

CREATE INDEX IX_Racha_IdUsuario_Fecha ON RachaDiaria(IdUsuario, Fecha);
CREATE INDEX IX_Racha_IdUsuario_Completado ON RachaDiaria(IdUsuario, EntrenamientoCompletado);

-- [20] ESTADÍSTICAS GENERALES
CREATE TABLE Estadisticas (
    IdEstadistica               SERIAL PRIMARY KEY,
    IdUsuario                   INT             NOT NULL UNIQUE,
    TotalFlashcardsVistas       INT             DEFAULT 0,
    TotalAciertos               INT             DEFAULT 0,
    TotalFallos                 INT             DEFAULT 0,
    TotalSesiones               INT             DEFAULT 0,
    TotalGameOvers              INT             DEFAULT 0,
    MejorRacha                  INT             DEFAULT 0,
    TiempoTotalEntrenamiento    INT             DEFAULT 0,
    PrecisionPromedio           DECIMAL(5,2)    DEFAULT 0.00,
    PalabrasDominadas           INT             DEFAULT 0,
    NivelActual                 INT             DEFAULT 1,
    UltimaActualizacion         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FK_Estad_Usuario FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE,

    CONSTRAINT CK_Estad_Precision CHECK (PrecisionPromedio >= 0 AND PrecisionPromedio <= 100)
);

CREATE INDEX IX_Estad_IdUsuario ON Estadisticas(IdUsuario);
CREATE INDEX IX_Estad_PrecisionPromedio ON Estadisticas(PrecisionPromedio);
CREATE INDEX IX_Estad_NivelActual ON Estadisticas(NivelActual);


-- ═══════════════════════════════════════════════════════════════════════════════
-- DATOS INICIALES (SEED)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Idiomas
INSERT INTO Idiomas (Nombre, CodigoISO, EsteticaVisual) VALUES
    ('Ruso', 'RU', 'soviet_style.css'),
    ('Mandarín', 'ZH', 'dynasty_style.css');

-- Rangos militares
INSERT INTO Rangos (NombreRango, NivelRequerido, IconoMilitar, Descripcion) VALUES
    ('Recluta', 1, '🎖️', 'Recién llegado al programa'),
    ('Operador', 5, '🔫', 'Capaz de manejar situaciones básicas'),
    ('Espía', 10, '🕵️', 'Infiltración en territorio hostil'),
    ('Aliado de Élite', 20, '🛡️', 'Máximo nivel de confianza');

-- Categorías de vocabulario
INSERT INTO Categorias (NombreCategoria, Descripcion, IconoMilitar, OrdenVisual) VALUES
    ('Militar', 'Vocabulario táctico y de campo', '🔫', 1),
    ('Supervivencia', 'Frases para situaciones extremas', '🛡️', 2),
    ('Slang', 'Expresiones coloquiales', '💬', 3),
    ('General', 'Vocabulario cotidiano', '📚', 4),
    ('Contrainteligencia', 'Términos de espionaje', '🕵️', 5);

-- Niveles de dificultad
INSERT INTO NivelesDificultad (NombreNivel, Descripcion, MultiplicadorPuntos, ColorTema) VALUES
    ('Clasificado', 'Nivel básico de acceso', 1.00, '#4a7c59'),
    ('Secreto', 'Requiere preparación previa', 1.50, '#d4a017'),
    ('Ultra Secreto', 'Máxima dificultad', 2.50, '#8b0000');

-- Diccionario de prueba
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, AudioUrl) VALUES
    (1, 1, 1, 'багаж', 'Bagash', 'Equipaje', 'https://audio.operacionbabel.ru/bagash.mp3'),
    (1, 1, 2, 'оружие', 'Oruzhiye', 'Arma', 'https://audio.operacionbabel.ru/oruzhiye.mp3'),
    (1, 4, 1, 'книга', 'Kniga', 'Libro', 'https://audio.operacionbabel.ru/kniga.mp3'),
    (2, 4, 1, '书', 'Shū', 'Libro', 'https://audio.operacionbabel.ru/shu.mp3'),
    (2, 1, 2, '武器', 'Wǔqì', 'Arma', 'https://audio.operacionbabel.ru/wuqi.mp3');

-- Frases de prueba
INSERT INTO Frases (IdIdioma, IdNivel, FraseOriginal, TraduccionEspanol, Pista, LetrasOcultas, TiempoLimiteSeg) VALUES
    (1, 1, 'Я читаю книгу', 'Yo leo un libro', 'Acción cotidiana con objeto de papel', 3, 45),
    (2, 1, '我在看书', 'Yo estoy leyendo', 'Acción de lectura en progreso', 2, 60);

-- Logros de prueba
INSERT INTO Logros (NombreLogro, Descripcion, Icono, CondicionDesbloqueo, CodigoCondicion, PuntosRecompensa, Secreto) VALUES
    ('Primera Sangre', 'Completar tu primera flashcard', '🩸', 'Completar 1 flashcard', 'FLASH_1', 10, FALSE),
    ('Superviviente', 'Sobrevivir 7 días consecutivos', '🏕️', 'Racha de 7 días', 'RACHA_7', 100, FALSE),
    ('Francotirador', '10 aciertos seguidos sin fallos', '🎯', '10 aciertos consecutivos', 'STREAK_10', 50, FALSE),
    ('Agente Encubierto', 'Desbloquear modo infiltración', '🕵️', 'Completar 5 frases', 'FRASE_5', 75, TRUE);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: MAZOS Y FLASHCARDS - OPERACION BABEL
-- ═══════════════════════════════════════════════════════════════════════════════

-- PASO 1: COMPLETAR EL DICCIONARIO

-- Ruso - Nivel 1 (Clasificado) - Categoría 4 General
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(1, 4, 1, 'КНИГА',  'Kniga',    'Libro',   'Objeto de lectura esencial en campo'),
(1, 4, 1, 'ВОДА',   'Voda',     'Agua',    'Recurso vital para supervivencia'),
(1, 4, 1, 'ДОМ',    'Dom',      'Casa',    'Estructura de refugio táctico'),
(1, 4, 1, 'ДРУГ',   'Drug',     'Amigo',   'Aliado de confianza en operación'),
(1, 4, 1, 'СОЛНЦЕ', 'Solntse',  'Sol',     'Referencia de orientación diurna');

-- Ruso - Nivel 2 (Secreto) - Categoría 1 Militar
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(1, 1, 2, 'ОРУЖИЕ',   'Oruzhiye', 'Arma',    'Equipamiento táctico de combate'),
(1, 1, 2, 'ПИСТОЛЕТ', 'Pistolet', 'Pistola', 'Arma de mano para defensa cercana'),
(1, 1, 2, 'НОЖ',      'Nozh',     'Cuchillo','Herramienta multifunción de campo'),
(1, 1, 2, 'ЩИТ',      'Shchit',   'Escudo',  'Protección balística frontal'),
(1, 1, 2, 'ГРАНАТА',  'Granata',  'Granada', 'Explosivo táctico de fragmentación');

-- Ruso - Nivel 2 (Secreto) - Categoría 2 Supervivencia
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(1, 2, 2, 'ВРАЧ',    'Vrach',    'Médico',  'Especialista médico de campo'),
(1, 2, 2, 'ПОМОЩЬ',  'Pomoshch', 'Ayuda',   'Solicitud de refuerzos médicos'),
(1, 2, 2, 'ВЫХОД',   'Vykhod',   'Salida',  'Ruta de evacuación primaria');

-- Ruso - Nivel 3 (Ultra Secreto) - Categoría 2 Supervivencia
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(1, 2, 3, 'ОПАСНОСТЬ', 'Opasnost',  'Peligro', 'Señal de alerta inmediata'),
(1, 2, 3, 'УКРЫТИЕ',   'Ukrytiye',  'Refugio', 'Posición defensiva temporal');

-- Ruso - Nivel 3 (Ultra Secreto) - Categoría 1 Militar
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(1, 1, 3, 'ПИСТОЛЕТ', 'Pistolet', 'Pistola', 'Arma de mano para defensa cercana');

-- Chino - Nivel 1 (Clasificado) - Categoría 4 General
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(2, 4, 1, '书', 'Shū',  'Libro',   'Carácter básico de escritura'),
(2, 4, 1, '水', 'Shuǐ', 'Agua',    'Elemento esencial de supervivencia'),
(2, 4, 1, '火', 'Huǒ',  'Fuego',   'Fuente de calor y señalización'),
(2, 4, 1, '人', 'Rén',  'Persona', 'Referencia humana básica'),
(2, 4, 1, '大', 'Dà',   'Grande',  'Descriptor de tamaño táctico');

-- Chino - Nivel 2 (Secreto) - Categoría 5 Contrainteligencia
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(2, 5, 2, '武器', 'Wǔqì',   'Arma',         'Sistema de armamento identificado'),
(2, 5, 2, '密码', 'Mìmǎ',   'Contraseña',   'Clave de acceso encriptada'),
(2, 5, 2, '医生', 'Yīshēng', 'Médico',       'Profesional de la medicina');

-- Chino - Nivel 3 (Ultra Secreto) - Categoría 5 Contrainteligencia
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(2, 5, 3, '间谍', 'Jiàndié', 'Espía',        'Agente encubierto hostil'),
(2, 5, 3, '监视', 'Jiānshì', 'Vigilancia',   'Operación de observación continua'),
(2, 5, 3, '情报', 'Qíngbào', 'Inteligencia', 'Datos clasificados de operación');

-- Chino - Nivel 3 (Ultra Secreto) - Categoría 3 Slang
INSERT INTO Diccionario (IdIdioma, IdCategoria, IdNivel, CaracterOriginal, LecturaAyuda, TraduccionEspanol, NotasContexto) VALUES
(2, 3, 3, '哥们儿', 'Gēmenr',  'Camarada',  'Término coloquial de camaradería'),
(2, 3, 3, '搞定',   'Gǎodìng', 'Resolver',  'Completar objetivo táctico'),
(2, 3, 3, '靠谱',   'Kàopǔ',   'Confiable', 'Evaluación de fiabilidad de aliado');

-- PASO 2: INSERTAR MAZOS
INSERT INTO MazosFlashcards (IdIdioma, IdCategoria, IdNivel, NombreMazo, Descripcion, OrdenVisual, Activo) VALUES
-- Mazos Rusos
(1, 4, 1, 'Vocabulario Básico RU',   'Palabras fundamentales para sobrevivir en territorio ruso',       1, TRUE),
(1, 1, 2, 'Arsenal Militar RU',      'Terminología táctica y armamento del ejército ruso',              2, TRUE),
(1, 2, 2, 'Supervivencia Urbana RU', 'Frases críticas para situaciones de emergencia en campo ruso',    3, TRUE),
-- Mazos Chinos
(2, 4, 1, 'Hanzi Fundamentales',     'Caracteres básicos del mandarín para reconocimiento de campo',    4, TRUE),
(2, 5, 2, 'Código Rojo ZH',          'Vocabulario de contrainteligencia y operaciones encubiertas',     5, TRUE),
(2, 3, 3, 'Slang de Campo ZH',       'Expresiones coloquiales para infiltración en zonas chinas',       6, TRUE);

-- PASO 3: INSERTAR FLASHCARDS
-- Mazo 1: Vocabulario Básico RU
INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, TipoFlashcard)
SELECT 1, d.IdItem, ROW_NUMBER() OVER (ORDER BY d.IdItem), 'NORMAL'
FROM Diccionario d
INNER JOIN Idiomas i ON d.IdIdioma = i.IdIdioma
WHERE i.CodigoISO = 'RU' AND d.IdNivel = 1 AND d.IdCategoria = 4;

-- Mazo 2: Arsenal Militar RU
INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, TipoFlashcard)
SELECT 2, d.IdItem, ROW_NUMBER() OVER (ORDER BY d.IdItem), 'NORMAL'
FROM Diccionario d
INNER JOIN Idiomas i ON d.IdIdioma = i.IdIdioma
WHERE i.CodigoISO = 'RU' AND d.IdNivel = 2 AND d.IdCategoria = 1;

-- Mazo 3: Supervivencia Urbana RU
INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, TipoFlashcard)
SELECT 3, d.IdItem, ROW_NUMBER() OVER (ORDER BY d.IdItem), 'NORMAL'
FROM Diccionario d
INNER JOIN Idiomas i ON d.IdIdioma = i.IdIdioma
WHERE i.CodigoISO = 'RU' AND d.IdNivel = 2 AND d.IdCategoria = 2;

-- Mazo 4: Hanzi Fundamentales
INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, TipoFlashcard)
SELECT 4, d.IdItem, ROW_NUMBER() OVER (ORDER BY d.IdItem), 'NORMAL'
FROM Diccionario d
INNER JOIN Idiomas i ON d.IdIdioma = i.IdIdioma
WHERE i.CodigoISO = 'ZH' AND d.IdNivel = 1 AND d.IdCategoria = 4;

-- Mazo 5: Código Rojo ZH
INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, TipoFlashcard)
SELECT 5, d.IdItem, ROW_NUMBER() OVER (ORDER BY d.IdItem), 'NORMAL'
FROM Diccionario d
INNER JOIN Idiomas i ON d.IdIdioma = i.IdIdioma
WHERE i.CodigoISO = 'ZH' AND d.IdNivel = 2 AND d.IdCategoria = 5;

-- Mazo 6: Slang de Campo ZH
INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, TipoFlashcard)
SELECT 6, d.IdItem, ROW_NUMBER() OVER (ORDER BY d.IdItem), 'NORMAL'
FROM Diccionario d
INNER JOIN Idiomas i ON d.IdIdioma = i.IdIdioma
WHERE i.CodigoISO = 'ZH' AND d.IdNivel = 3 AND d.IdCategoria = 3;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
    m.NombreMazo,
    i.CodigoISO AS Idioma,
    n.NombreNivel AS Nivel,
    COUNT(f.IdFlashcard) AS TotalFlashcards
FROM MazosFlashcards m
LEFT JOIN Flashcards f ON f.IdMazo = m.IdMazo
LEFT JOIN Idiomas i ON m.IdIdioma = i.IdIdioma
LEFT JOIN NivelesDificultad n ON m.IdNivel = n.IdNivel
GROUP BY m.NombreMazo, i.CodigoISO, n.NombreNivel
ORDER BY m.OrdenVisual;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONFIGURACIÓN DE USUARIOS Y PERMISOS (OPCIONAL)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Crear usuario de aplicación (ejecutar como superusuario)
-- CREATE USER babeluser WITH PASSWORD 'OperacionBabel2026!';
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO babeluser;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO babeluser;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTAS DE MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. IDENTITY → SERIAL: PostgreSQL usa SERIAL para autoincremento
-- 2. NVARCHAR → VARCHAR: PostgreSQL maneja UTF-8 nativamente
-- 3. DATETIME2 → TIMESTAMP: Equivalente en PostgreSQL
-- 4. BIT → BOOLEAN: PostgreSQL usa BOOLEAN nativo
-- 5. GETDATE() → CURRENT_TIMESTAMP / CURRENT_DATE
-- 6. GO → Eliminado (no existe en PostgreSQL)
-- 7. PRINT → Eliminado (usar RAISE NOTICE si se necesita)
-- 8. CONSTRAINT CHECK con IN → Valido en ambos, mantenido
-- 9. ON DELETE SET DEFAULT → PostgreSQL lo soporta
-- 10. dbo. → Eliminado (esquema public por defecto en PostgreSQL)
-- ═══════════════════════════════════════════════════════════════════════════════
